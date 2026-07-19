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
import { Select } from 'primeng/select';

import { GroupStudent } from '../../../../models';
import { FieldErrorComponent } from '../../../../shared/components';
import { PlanPickersController } from '../../services/plan-pickers.controller';
import { GroupFormGroup } from '../../utils/group-form.util';
import { ScheduleSubformComponent } from '../schedule-subform/schedule-subform.component';

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
    FieldErrorComponent,
    ScheduleSubformComponent,
  ],
  templateUrl: './group-card.component.html',
})
export class GroupCardComponent {
  private readonly people = inject(PlanPickersController);

  readonly form = input.required<GroupFormGroup>();
  /** Snapshots of the students currently in the group, for names/matrículas. */
  readonly students = input.required<GroupStudent[]>();
  readonly editable = input(true);
  readonly submitted = input(false);

  readonly removeGroup = output<void>();
  readonly removeStudent = output<number>();
  readonly addStudent = output<number>();

  /** Snapshot del catálogo; es una de las columnas del formato oficial (HU-58). */
  readonly tipoUea = computed(() => this.form().controls.tipoUea.value);

  readonly professorOptions = this.people.professors;
  readonly studentOptions = this.people.students;
  readonly peopleLoading = this.people.loading;

  /**
   * Los valores de un `FormControl` no son señales, así que un `computed` que los lee
   * no se recalcula al teclear. Se bombea una revisión desde `valueChanges`, mismo
   * patrón que `annual-plan-grid` y `field-error`.
   */
  private readonly cupoRevision = signal(0);

  /** Non-blocking notice: exceeding the cupo warns, it never blocks (HU-59). */
  readonly overCapacity = computed(() => {
    this.cupoRevision();
    const cupo = this.form().controls.cupo.value.trim();
    if (!cupo || cupo === '*') return false;
    const limit = Number(cupo);
    return !Number.isNaN(limit) && this.students().length > limit;
  });

  constructor() {
    // El input `form` puede cambiar de instancia: se resuscribe con cada una.
    effect((onCleanup) => {
      const subscription = this.form().controls.cupo.valueChanges.subscribe(() =>
        this.cupoRevision.update((value) => value + 1),
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

  /** The picker only offers people not already in the group. */
  onStudentPicked(studentId: number | null): void {
    if (studentId === null) return;
    if (this.students().some((student) => student.studentId === studentId)) return;
    this.addStudent.emit(studentId);
  }
}
