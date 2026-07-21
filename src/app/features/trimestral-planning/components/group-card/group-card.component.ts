import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';

import { GroupStudent } from '../../../../models';
import { FieldErrorComponent } from '../../../../shared/components';
import { PlanPickersController } from '../../services/plan-pickers.controller';
import { buildStudentRow, GroupFormGroup } from '../../utils/group-form.util';
import { ScheduleSubformComponent } from '../schedule-subform/schedule-subform.component';

/**
 * HU-59 — one group as an inline capture row (nothing to expand): identity + base fields,
 * the 5-day schedule and the student list are always visible and editable in place. The
 * 25-column width still belongs to the export format, not to this UI.
 */
@Component({
  selector: 'app-group-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    TranslatePipe,
    Button,
    InputText,
    Select,
    FieldErrorComponent,
    ScheduleSubformComponent,
  ],
  templateUrl: './group-card.component.html',
})
export class GroupCardComponent {
  private readonly people = inject(PlanPickersController);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = input.required<GroupFormGroup>();
  /**
   * Snapshots que devolvió el servidor: aportan trimestre declarado y `source`, que el
   * formulario no lleva (solo guarda studentId + nota). No se mutan al agregar o quitar.
   */
  readonly students = input.required<GroupStudent[]>();
  readonly editable = input(true);
  readonly submitted = input(false);

  readonly removeGroup = output<void>();

  /**
   * Los valores de un `FormControl` no son señales, así que un `computed` que los lee
   * no se recalcula al teclear. Se bombea una revisión desde `valueChanges`, mismo
   * patrón que `annual-plan-grid` y `field-error`.
   */
  private readonly revision = signal(0);

  /** Selección transitoria del typeahead de alta; se limpia en cuanto se agrega. */
  readonly studentPick = signal<number | null>(null);

  /**
   * Integrantes actuales, alineados por índice con las filas del `FormArray` de alumnos:
   * el formulario manda (studentId + nota), los snapshots del servidor solo decoran.
   */
  readonly members = computed<GroupStudent[]>(() => {
    this.revision();
    const snapshots = this.students();
    return this.form().controls.students.controls.map((row) => {
      const studentId = row.controls.studentId.value;
      return (
        snapshots.find((student) => student.studentId === studentId) ??
        this.fallbackMember(studentId)
      );
    });
  });

  /** Non-blocking notice: exceeding the cupo warns, it never blocks (HU-59). */
  readonly overCapacity = computed(() => {
    this.revision();
    const cupo = this.form().controls.cupo.value.trim();
    if (!cupo || cupo === '*') return false;
    const limit = Number(cupo);
    return !Number.isNaN(limit) && this.members().length > limit;
  });

  /** Snapshot del catálogo; es una de las columnas del formato oficial (HU-58). */
  readonly tipoUea = computed(() => this.form().controls.tipoUea.value);

  readonly professorOptions = this.people.professors;
  readonly studentOptions = this.people.students;
  readonly professorsLoading = this.people.professorsLoading;
  readonly studentsLoading = this.people.studentsLoading;

  constructor() {
    // El input `form` puede cambiar de instancia: se resuscribe con cada una.
    effect((onCleanup) => {
      const subscription = this.form().valueChanges.subscribe(() =>
        this.revision.update((value) => value + 1),
      );
      onCleanup(() => subscription.unsubscribe());
    });
  }

  onProfessorFilter(event: { filter?: string | null }): void {
    this.people.onProfessorFilter(event.filter);
  }

  onStudentFilter(event: { filter?: string | null }): void {
    this.people.onStudentFilter(event.filter);
  }

  /** HU-59 — alta desde el typeahead; elegir a alguien que ya está en el grupo no duplica. */
  addStudent(studentId: number | null): void {
    if (studentId === null) return;

    const rows = this.form().controls.students;
    if (!rows.controls.some((row) => row.controls.studentId.value === studentId)) {
      rows.push(buildStudentRow(this.fb, studentId));
    }
    this.studentPick.set(null);
  }

  removeStudent(index: number): void {
    this.form().controls.students.removeAt(index);
  }

  /** Alumno marcado que el servidor aún no conoce: se arma del catálogo del picker. */
  private fallbackMember(studentId: number): GroupStudent {
    const picked = this.people.studentById(studentId);
    return {
      studentId,
      enrollmentId: picked?.enrollmentId ?? '',
      fullName: picked
        ? [picked.firstName, picked.firstLastName, picked.secondLastName].filter(Boolean).join(' ')
        : '',
      source: 'MANUAL',
      academicTerm: null,
      obs: null,
    };
  }
}
