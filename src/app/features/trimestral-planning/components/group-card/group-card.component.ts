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
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';

import { GroupStudent } from '../../../../models';
import { FieldErrorComponent } from '../../../../shared/components';
import { PlanPickersController } from '../../services/plan-pickers.controller';
import { GroupFormGroup } from '../../utils/group-form.util';
import { ScheduleSubformComponent } from '../schedule-subform/schedule-subform.component';

/** Sufijo único por tarjeta: dos grupos de la misma UEA no pueden compartir ids del DOM. */
let nextGroupKey = 0;

/**
 * HU-59 — one group as an expandable card (`<details>`), not a 25-column row: that width
 * belongs to the export format, not to a capture UI.
 */
@Component({
  selector: 'app-group-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    Button,
    InputText,
    Select,
    MultiSelect,
    FieldErrorComponent,
    ScheduleSubformComponent,
  ],
  templateUrl: './group-card.component.html',
})
export class GroupCardComponent {
  private readonly people = inject(PlanPickersController);

  readonly form = input.required<GroupFormGroup>();
  /**
   * Snapshots que devolvió el servidor: aportan trimestre declarado y `source`, que el
   * formulario no lleva (solo guarda `studentIds`). No se mutan al marcar o desmarcar.
   */
  readonly students = input.required<GroupStudent[]>();
  readonly editable = input(true);
  readonly submitted = input(false);

  readonly removeGroup = output<void>();

  readonly groupKey = signal(`g${nextGroupKey++}`);

  /**
   * Los valores de un `FormControl` no son señales, así que un `computed` que los lee
   * no se recalcula al teclear. Se bombea una revisión desde `valueChanges`, mismo
   * patrón que `annual-plan-grid` y `field-error`.
   */
  private readonly revision = signal(0);

  /** Integrantes actuales: el formulario manda, los snapshots solo decoran. */
  readonly members = computed<GroupStudent[]>(() => {
    this.revision();
    const snapshots = this.students();
    return this.form().controls.studentIds.value.map(
      (studentId) =>
        snapshots.find((student) => student.studentId === studentId) ??
        this.fallbackMember(studentId),
    );
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
  readonly peopleLoading = this.people.loading;

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
    };
  }
}
