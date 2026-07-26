import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

import { SCHEDULE_DAYS, TrimestralGroup } from '../../../../models';
import { buildGroupFormGroup, GroupFormGroup } from '../../utils/group-form.util';
import { ScheduleSubformComponent } from './schedule-subform.component';

function groupWith(start: string | null, end: string | null): TrimestralGroup {
  return {
    id: 10,
    ueaId: 1,
    clave: '2156024',
    nombre: 'REDES',
    tipoUea: 'OBLIGATORIA',
    grupo: 'CO43',
    cupo: '15',
    maxGroups: '2',
    professors: [],
    schedule: SCHEDULE_DAYS.map((day) => ({
      day,
      start: day === 'LUN' ? start : null,
      end: day === 'LUN' ? end : null,
      lab: false,
    })),
    students: [],
  };
}

@Component({
  imports: [ScheduleSubformComponent],
  template: `<app-schedule-subform [schedule]="form.controls.schedule" />`,
})
class HostComponent {
  form!: GroupFormGroup;
}

describe('ScheduleSubformComponent', () => {
  async function setup(start: string | null = null, end: string | null = null) {
    await TestBed.configureTestingModule({
      imports: [HostComponent, TranslateModule.forRoot(), NoopAnimationsModule],
    }).compileComponents();

    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.form = buildGroupFormGroup(
      new FormBuilder().nonNullable,
      groupWith(start, end),
    );
    fixture.detectChanges();

    const subform = fixture.debugElement.children[0]!.componentInstance as ScheduleSubformComponent;
    return { fixture, subform, monday: fixture.componentInstance.form.controls.schedule.at(0) };
  }

  it('renders one start and one end select per weekday', async () => {
    const { fixture } = await setup();

    expect(fixture.nativeElement.querySelectorAll('[data-testid="time-select"]')).toHaveLength(10);
  });

  it('only offers end times after the captured start', async () => {
    const { subform, monday } = await setup('09:00', '11:00');

    const options = subform.endOptionsFor(monday);

    expect(options).not.toContain('09:00');
    expect(options).not.toContain('08:30');
    expect(options[0]).toBe('09:30');
  });

  it('keeps a legacy time outside the half-hour grid instead of dropping it', async () => {
    // Sin esto el select lo mostraría vacío y el guardado borraría el horario en silencio.
    const { subform, monday } = await setup('09:47', '11:00');

    expect(subform.startOptionsFor(monday)).toContain('09:47');
    expect(monday.controls.start.value).toBe('09:47');
  });

  it('leaves an empty day valid, with the whole grid available', async () => {
    const { subform, monday } = await setup();

    expect(monday.errors).toBeNull();
    expect(subform.endOptionsFor(monday)).toHaveLength(31);
  });
});
