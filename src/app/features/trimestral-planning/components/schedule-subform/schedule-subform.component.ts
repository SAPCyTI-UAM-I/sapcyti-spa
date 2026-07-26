import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Checkbox } from 'primeng/checkbox';
import { Select } from 'primeng/select';

import { ScheduleFormGroup } from '../../utils/group-form.util';
import { endOptions, startOptions } from '../../utils/time-slot.util';

/**
 * HU-59 — the 5 fixed weekdays of a group. Times are captured as half-hour blocks so
 * they always read in 24h, like the Excel; `lab` is the only room information the
 * coordinator captures (it exports as `LAB`).
 *
 * Read-only mode needs no input: the editor disables the whole `FormArray`, and the
 * selects inherit that through `formControlName`.
 */
@Component({
  selector: 'app-schedule-subform',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslatePipe, Checkbox, Select],
  templateUrl: './schedule-subform.component.html',
})
export class ScheduleSubformComponent {
  readonly schedule = input.required<FormArray<ScheduleFormGroup>>();

  startOptionsFor(day: ScheduleFormGroup): string[] {
    return startOptions(day.controls.start.value);
  }

  endOptionsFor(day: ScheduleFormGroup): string[] {
    return endOptions(day.controls.start.value, day.controls.end.value);
  }
}
