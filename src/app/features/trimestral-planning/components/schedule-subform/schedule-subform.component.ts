import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { FormArray, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Select } from 'primeng/select';

import { ScheduleDay } from '../../../../models';
import { hasScheduleDayCapture, ScheduleFormGroup } from '../../utils/group-form.util';
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
  imports: [ReactiveFormsModule, FormsModule, TranslatePipe, Button, Checkbox, Select],
  templateUrl: './schedule-subform.component.html',
})
export class ScheduleSubformComponent {
  readonly schedule = input.required<FormArray<ScheduleFormGroup>>();

  /** Día del que se copia el rango; la mayoría de los grupos repiten el mismo bloque. */
  readonly copySource = signal<ScheduleDay | null>(null);

  readonly dayOptions = computed(() =>
    this.schedule()
      .controls.filter((day) => !!day.controls.start.value && !!day.controls.end.value)
      .map((day) => day.controls.day.value),
  );

  startOptionsFor(day: ScheduleFormGroup): string[] {
    return startOptions(day.controls.start.value);
  }

  endOptionsFor(day: ScheduleFormGroup): string[] {
    return endOptions(day.controls.start.value, day.controls.end.value);
  }

  /**
   * Copia el rango del día elegido a los demás días que ya tengan algo capturado.
   * No toca LAB: el laboratorio depende del día, no del horario.
   */
  copyRangeToCapturedDays(): void {
    const source = this.schedule().controls.find(
      (day) => day.controls.day.value === this.copySource(),
    );
    if (!source) return;

    const { start, end } = source.getRawValue();
    for (const day of this.schedule().controls) {
      if (day === source || !hasScheduleDayCapture(day)) continue;
      day.patchValue({ start, end });
    }
  }
}
