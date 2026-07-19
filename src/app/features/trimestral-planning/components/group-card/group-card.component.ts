import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';

import { GroupStudent } from '../../../../models';
import { FieldErrorComponent } from '../../../../shared/components';
import { PeopleSearchController } from '../../services/people-search.controller';
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
  private readonly people = inject(PeopleSearchController);

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

  /** Non-blocking notice: exceeding the cupo warns, it never blocks (HU-59). */
  readonly overCapacity = computed(() => {
    const cupo = this.form().controls.cupo.value.trim();
    if (!cupo || cupo === '*') return false;
    const limit = Number(cupo);
    return !Number.isNaN(limit) && this.students().length > limit;
  });

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
