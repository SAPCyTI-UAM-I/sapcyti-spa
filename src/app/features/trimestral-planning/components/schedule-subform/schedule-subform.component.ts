import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Checkbox } from 'primeng/checkbox';

import { ScheduleFormGroup } from '../../utils/group-form.util';

/**
 * HU-59 — the 5 fixed weekdays of a group. `<input type="time">` is native; `lab` is the
 * only room information the coordinator captures (it exports as `LAB`).
 */
@Component({
  selector: 'app-schedule-subform',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslatePipe, Checkbox],
  templateUrl: './schedule-subform.component.html',
})
export class ScheduleSubformComponent {
  readonly schedule = input.required<FormArray<ScheduleFormGroup>>();
  readonly editable = input(true);
}
