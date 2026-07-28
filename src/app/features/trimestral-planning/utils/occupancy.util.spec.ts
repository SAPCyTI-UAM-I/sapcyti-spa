import { FormBuilder, NonNullableFormBuilder } from '@angular/forms';

import { SCHEDULE_DAYS, TrimestralGroup } from '../../../models';
import { buildGroupFormGroup } from './group-form.util';
import { isGroupIncomplete, occupancyLabel, occupancySeverity } from './occupancy.util';

const fb: NonNullableFormBuilder = new FormBuilder().nonNullable;

const group: TrimestralGroup = {
  id: 10,
  ueaId: 1,
  clave: '2156024',
  nombre: 'REDES',
  tipoUea: 'OBLIGATORIA',
  grupo: 'CO43',
  cupo: '15',
  maxGroups: '2',
  professors: [{ professorId: 5, employeeNumber: '40001', professorName: 'Prieto' }],
  schedule: SCHEDULE_DAYS.map((day) => ({
    day,
    start: day === 'LUN' ? '09:00' : null,
    end: day === 'LUN' ? '11:00' : null,
    lab: false,
  })),
  students: [],
};

describe('occupancyLabel', () => {
  it('reads as members over the limit', () => {
    expect(occupancyLabel('15', 12)).toBe('12/15');
  });

  it('drops the denominator when there is no limit', () => {
    expect(occupancyLabel('*', 12)).toBe('12');
    expect(occupancyLabel('', 12)).toBe('12');
  });
});

describe('occupancySeverity', () => {
  it('flags full and over capacity apart', () => {
    expect(occupancySeverity('15', 12)).toBe('ok');
    expect(occupancySeverity('15', 15)).toBe('full');
    expect(occupancySeverity('15', 17)).toBe('over');
  });

  it('never flags an open or undefined cupo', () => {
    expect(occupancySeverity('*', 99)).toBe('ok');
    expect(occupancySeverity('', 99)).toBe('ok');
  });
});

describe('isGroupIncomplete', () => {
  it('accepts a group with letter, professor and schedule', () => {
    expect(isGroupIncomplete(buildGroupFormGroup(fb, group))).toBe(false);
  });

  it('flags a missing group letter, professor or schedule', () => {
    const noLetter = buildGroupFormGroup(fb, { ...group, grupo: null });
    const noProfessor = buildGroupFormGroup(fb, { ...group, professors: [] });
    const noSchedule = buildGroupFormGroup(fb, {
      ...group,
      schedule: SCHEDULE_DAYS.map((day) => ({ day, start: null, end: null, lab: false })),
    });

    expect(isGroupIncomplete(noLetter)).toBe(true);
    expect(isGroupIncomplete(noProfessor)).toBe(true);
    expect(isGroupIncomplete(noSchedule)).toBe(true);
  });
});
