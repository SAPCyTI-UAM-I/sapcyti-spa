import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ProfessorCatalogItem, StudentCatalogItem, UeaCatalogItem } from '../../../models';
import { TrimestralPlanService } from './trimestral-plan.service';

export interface PersonOption {
  readonly label: string;
  readonly value: number;
}

const DEBOUNCE_MS = 300;

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
  readonly loading = signal(false);

  private timeout?: ReturnType<typeof setTimeout>;

  /** Handler for `p-select (onFilter)`. */
  onProfessorFilter(term: string | null | undefined): void {
    this.debounce(() => this.loadProfessors(term ?? ''));
  }

  onStudentFilter(term: string | null | undefined): void {
    this.debounce(() => this.loadStudents(term ?? ''));
  }

  loadProfessors(search = ''): void {
    this.loading.set(true);
    this.service
      .searchProfessors(search.trim())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => this.professors.set(page.content.map(professorOption)),
        error: () => this.professors.set([]),
      });
  }

  loadStudents(search = ''): void {
    this.loading.set(true);
    this.service
      .searchStudents(search.trim())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => this.students.set(page.content.map(studentOption)),
        error: () => this.students.set([]),
      });
  }

  onUeaFilter(term: string | null | undefined): void {
    this.debounce(() => this.loadUeas(term ?? ''));
  }

  loadUeas(search = ''): void {
    this.loading.set(true);
    this.service
      .searchUeas(search.trim())
      .pipe(
        finalize(() => this.loading.set(false)),
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

  private debounce(run: () => void): void {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(run, DEBOUNCE_MS);
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

function ueaOption(uea: UeaCatalogItem): PersonOption {
  return { value: uea.id, label: `${uea.clave} — ${uea.nombre}` };
}

function studentOption(student: StudentCatalogItem): PersonOption {
  const name = [student.firstName, student.firstLastName, student.secondLastName]
    .filter(Boolean)
    .join(' ');
  return { value: student.id, label: `${student.enrollmentId} — ${name}` };
}
