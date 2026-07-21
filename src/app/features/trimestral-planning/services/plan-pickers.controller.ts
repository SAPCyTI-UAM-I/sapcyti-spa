import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import {
  GroupStudent,
  ProfessorCatalogItem,
  StudentCatalogItem,
  TrimestralGroup,
  UeaCatalogItem,
} from '../../../models';
import { TrimestralPlanService } from './trimestral-plan.service';

export interface PersonOption {
  readonly label: string;
  readonly value: number;
}

const DEBOUNCE_MS = 300;

type Picker = 'professors' | 'students' | 'ueas';

/**
 * Debounced remote search for the professor and student pickers (HU-59). Same shape as
 * `ProfessorOptionsController` in academic-catalog, re-implemented here because features
 * must not import each other; it drops the student-program pinning that feature needs.
 *
 * Provided per component (`providers: [PlanPickersController]`), never in root.
 */
@Injectable()
export class PlanPickersController {
  private readonly service = inject(TrimestralPlanService);
  private readonly destroyRef = inject(DestroyRef);

  readonly professors = signal<PersonOption[]>([]);
  readonly students = signal<PersonOption[]>([]);
  /** Catálogo activo para elegir la UEA de un grupo nuevo (HU-59). */
  readonly ueas = signal<PersonOption[]>([]);
  private readonly ueaCatalog = signal<UeaCatalogItem[]>([]);
  private readonly studentCatalog = signal<StudentCatalogItem[]>([]);
  /** Un indicador por buscador: los tres corren en paralelo y no comparten spinner. */
  readonly professorsLoading = signal(false);
  readonly studentsLoading = signal(false);
  readonly ueasLoading = signal(false);

  private readonly timeouts = new Map<Picker, ReturnType<typeof setTimeout>>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const timeout of this.timeouts.values()) {
        clearTimeout(timeout);
      }
    });
  }

  /** Handler for `p-select (onFilter)`. */
  onProfessorFilter(term: string | null | undefined): void {
    this.debounce('professors', () => this.loadProfessors(term ?? ''));
  }

  onStudentFilter(term: string | null | undefined): void {
    this.debounce('students', () => this.loadStudents(term ?? ''));
  }

  loadProfessors(search = ''): void {
    this.professorsLoading.set(true);
    this.service
      .searchProfessors(search.trim())
      .pipe(
        finalize(() => this.professorsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => this.professors.set(page.content.map(professorOption)),
        error: () => this.professors.set([]),
      });
  }

  loadStudents(search = ''): void {
    this.studentsLoading.set(true);
    this.service
      .searchStudents(search.trim())
      .pipe(
        finalize(() => this.studentsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => {
          this.studentCatalog.set(page.content);
          // Se fusiona en vez de reemplazar: los ya asignados siguen marcados aunque el
          // filtro actual no los devuelva.
          this.students.update((options) => mergeOptions(page.content.map(studentOption), options));
        },
        error: () => {
          this.studentCatalog.set([]);
          this.students.set([]);
        },
      });
  }

  onUeaFilter(term: string | null | undefined): void {
    this.debounce('ueas', () => this.loadUeas(term ?? ''));
  }

  loadUeas(search = ''): void {
    this.ueasLoading.set(true);
    this.service
      .searchUeas(search.trim())
      .pipe(
        finalize(() => this.ueasLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => {
          this.ueaCatalog.set(page.content);
          this.ueas.set(page.content.map(ueaOption));
        },
        error: () => {
          this.ueaCatalog.set([]);
          this.ueas.set([]);
        },
      });
  }

  /**
   * Datos crudos de la UEA elegida. Se guardan aparte de las opciones para no tener que
   * reconstruirlos partiendo el label: el label es presentación, no una fuente de datos.
   */
  ueaById(ueaId: number): UeaCatalogItem | undefined {
    return this.ueaCatalog().find((uea) => uea.id === ueaId);
  }

  /** Ídem para el alumno: el snapshot sale del DTO, no de partir la etiqueta. */
  studentById(studentId: number): StudentCatalogItem | undefined {
    return this.studentCatalog().find((student) => student.id === studentId);
  }

  /**
   * Ídem para los profesores ya asignados: el encabezado del grupo dice «sin profesor»
   * cuando no encuentra la opción, así que un profesor fuera de la primera página del
   * buscador mentiría. El snapshot del plan trae NEMP y nombre.
   */
  pinProfessors(groups: readonly TrimestralGroup[]): void {
    const pinned = groups.flatMap((group): PersonOption[] =>
      group.professors.map((professor) => {
        const name = professor.professorName ?? '';
        return {
          value: professor.professorId,
          label: professor.employeeNumber ? `${professor.employeeNumber} — ${name}` : name,
        };
      }),
    );
    this.professors.update((options) => mergeOptions(options, pinned));
  }

  /**
   * Fija en las opciones a los alumnos que ya están en algún grupo. Sin esto, un alumno
   * que el buscador no devuelve —dado de baja, o fuera de la página filtrada— no
   * aparecería marcado en el multiselect y se perdería al guardar.
   */
  pinStudents(students: readonly GroupStudent[]): void {
    const pinned = students.map(
      (student): PersonOption => ({
        value: student.studentId,
        label: `${student.enrollmentId} — ${student.fullName}`.trim(),
      }),
    );
    this.students.update((options) => mergeOptions(options, pinned));
  }

  /** Debounce por buscador: teclear en uno no puede cancelar la búsqueda de otro. */
  private debounce(picker: Picker, run: () => void): void {
    clearTimeout(this.timeouts.get(picker));
    this.timeouts.set(picker, setTimeout(run, DEBOUNCE_MS));
  }
}

/** Searchable by NEMP or name, so both go in the label. */
function professorOption(professor: ProfessorCatalogItem): PersonOption {
  const name = [professor.firstName, professor.firstLastName, professor.secondLastName]
    .filter(Boolean)
    .join(' ');
  return {
    value: professor.id,
    label: professor.employeeNumber ? `${professor.employeeNumber} — ${name}` : name,
  };
}

/** Une dos listas de opciones sin duplicar por id, ordenadas por etiqueta. */
function mergeOptions(
  base: readonly PersonOption[],
  extra: readonly PersonOption[],
): PersonOption[] {
  const byValue = new Map(base.map((option) => [option.value, option]));
  for (const option of extra) {
    if (!byValue.has(option.value)) {
      byValue.set(option.value, option);
    }
  }
  return [...byValue.values()].sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

function ueaOption(uea: UeaCatalogItem): PersonOption {
  return { value: uea.id, label: `${uea.clave} — ${uea.nombre}` };
}

function studentOption(student: StudentCatalogItem): PersonOption {
  const name = [student.firstName, student.firstLastName, student.secondLastName]
    .filter(Boolean)
    .join(' ');
  return { value: student.id, label: `${student.enrollmentId} — ${name}` };
}
