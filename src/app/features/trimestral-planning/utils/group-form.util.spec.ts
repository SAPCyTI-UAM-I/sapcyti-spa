import { FormBuilder, NonNullableFormBuilder } from '@angular/forms';

import { SCHEDULE_DAYS, TrimestralGroup } from '../../../models';
import {
  buildGroupFormGroup,
  buildSaveGroupsRequest,
  CUPO_PATTERN,
  emptyGroup,
  startBeforeEndValidator,
} from './group-form.util';

const fb: NonNullableFormBuilder = new FormBuilder().nonNullable;

const group: TrimestralGroup = {
  id: 12,
  ueaId: 40,
  clave: '2156024',
  nombre: 'REDES',
  tipoUea: 'OBLIGATORIA',
  grupo: 'co43',
  cupo: '25',
  professorId: 8,
  employeeNumber: '40001',
  professorName: 'Rafaela Blanco',
  schedule: [{ day: 'LUN', start: '08:30', end: '10:00', lab: false }],
  obs: '  ',
  students: [
    {
      studentId: 101,
      enrollmentId: 'A1',
      fullName: 'Ana',
      source: 'SURVEY',
      academicTerm: 'II',
    },
  ],
};

describe('group-form.util', () => {
  it('always builds the 5 fixed days, filling gaps with empty values', () => {
    const form = buildGroupFormGroup(fb, group);
    const days = form.controls.schedule.getRawValue();

    expect(days.map((d) => d.day)).toEqual([...SCHEDULE_DAYS]);
    expect(days[0]).toMatchObject({ start: '08:30', end: '10:00', lab: false });
    expect(days[1]).toMatchObject({ start: '', end: '', lab: false });
  });

  it('maps the form back to the API payload, trimming and uppercasing', () => {
    const request = buildSaveGroupsRequest([buildGroupFormGroup(fb, group)]);

    expect(request.groups[0]).toMatchObject({
      id: 12,
      ueaId: 40,
      grupo: 'CO43',
      cupo: '25',
      professorId: 8,
      obs: null,
      studentIds: [101],
    });
    expect(request.groups[0]!.schedule).toHaveLength(5);
    expect(request.groups[0]!.schedule[1]).toEqual({
      day: 'MAR',
      start: null,
      end: null,
      lab: false,
    });
  });

  it('sends id null for a group created in this session', () => {
    const form = buildGroupFormGroup(fb, emptyGroup(7, '2156027', 'IA'));

    expect(buildSaveGroupsRequest([form]).groups[0]!.id).toBeNull();
  });

  it('rejects an end time before the start time', () => {
    const form = buildGroupFormGroup(fb, group);
    const monday = form.controls.schedule.at(0);

    expect(monday.valid).toBe(true);
    monday.patchValue({ start: '10:00', end: '08:30' });
    expect(monday.errors).toEqual({ startAfterEnd: true });
  });

  it('accepts only a positive integer or * as cupo', () => {
    expect(CUPO_PATTERN.test('25')).toBe(true);
    expect(CUPO_PATTERN.test('*')).toBe(true);
    expect(CUPO_PATTERN.test('0')).toBe(false);
    expect(CUPO_PATTERN.test('012')).toBe(false);
    expect(CUPO_PATTERN.test('x')).toBe(false);
  });

  it('leaves a day with only one end untouched (partial capture is allowed)', () => {
    const form = buildGroupFormGroup(fb, group);
    const tuesday = form.controls.schedule.at(1);
    tuesday.patchValue({ start: '09:00' });

    expect(startBeforeEndValidator(tuesday)).toBeNull();
  });
});
