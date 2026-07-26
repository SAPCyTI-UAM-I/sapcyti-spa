import { FormBuilder, NonNullableFormBuilder } from '@angular/forms';

import { SCHEDULE_DAYS, TrimestralGroup, UeaCatalogItem } from '../../../models';
import {
  buildGroupFormGroup,
  buildSaveGroupsRequest,
  emptyGroup,
  hasScheduleCapture,
  hasScheduleDayCapture,
  startBeforeEndValidator,
} from './group-form.util';
import { QUOTA_PATTERN } from '../../../shared/utils/quota.util';

const fb: NonNullableFormBuilder = new FormBuilder().nonNullable;

const uea: UeaCatalogItem = {
  id: 7,
  clave: '2156027',
  nombre: 'INTELIGENCIA ARTIFICIAL',
  tipo: 'OPTATIVA',
  modalidad: 'MIXTA',
  horasTeoria: 3,
  horasPractica: 3,
  tipoFormacion: 'BASICA',
  creditos: 9,
  active: true,
};

const group: TrimestralGroup = {
  id: 12,
  ueaId: 40,
  clave: '2156024',
  nombre: 'REDES',
  tipoUea: 'OBLIGATORIA',
  grupo: 'co43',
  cupo: '25',
  maxGroups: '2',
  professors: [
    { professorId: 8, employeeNumber: '40001', professorName: 'Rafaela Blanco' },
    { professorId: 9, employeeNumber: '40002', professorName: 'Elena Soto' },
  ],
  schedule: [{ day: 'LUN', start: '08:30', end: '10:00', lab: false }],
  students: [
    {
      studentId: 101,
      enrollmentId: 'A1',
      fullName: 'Ana',
      source: 'SURVEY',
      academicTerm: 'II',
      obs: ' PIB ',
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

  it('shares one definition of a captured schedule across summaries and filters', () => {
    const form = buildGroupFormGroup(fb, emptyGroup(uea));
    const monday = form.controls.schedule.at(0);

    expect(hasScheduleCapture(form.controls.schedule)).toBe(false);
    monday.controls.lab.setValue(true);

    expect(hasScheduleDayCapture(monday)).toBe(true);
    expect(hasScheduleCapture(form.controls.schedule)).toBe(true);
  });

  // La spec pide `grupo` «sin formato forzado» (letras «quemadas»): se manda tal cual.
  it('maps the form back to the API payload, trimming but not reformatting the letter', () => {
    const request = buildSaveGroupsRequest([buildGroupFormGroup(fb, group)]);

    expect(request.groups[0]).toMatchObject({
      id: 12,
      ueaId: 40,
      grupo: 'co43',
      cupo: '25',
      professorIds: [8, 9],
      // La nota por alumno viaja con su fila, recortada igual que los demás strings.
      students: [{ studentId: 101, obs: 'PIB' }],
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
    const form = buildGroupFormGroup(fb, emptyGroup(uea));

    expect(buildSaveGroupsRequest([form]).groups[0]!.id).toBeNull();
    // Los snapshots del catálogo se copian tal cual, no se parsean de una etiqueta.
    expect(form.controls.clave.value).toBe('2156027');
    expect(form.controls.tipoUea.value).toBe('OPTATIVA');
  });

  it('rejects an end time before the start time', () => {
    const form = buildGroupFormGroup(fb, group);
    const monday = form.controls.schedule.at(0);

    expect(monday.valid).toBe(true);
    monday.patchValue({ start: '10:00', end: '08:30' });
    expect(monday.errors).toEqual({ startAfterEnd: true });
  });

  it('accepts only a positive integer or * as cupo', () => {
    expect(QUOTA_PATTERN.test('25')).toBe(true);
    expect(QUOTA_PATTERN.test('*')).toBe(true);
    expect(QUOTA_PATTERN.test('0')).toBe(false);
    expect(QUOTA_PATTERN.test('012')).toBe(false);
    expect(QUOTA_PATTERN.test('x')).toBe(false);
  });

  it('requires start and end together while allowing a completely empty day', () => {
    const form = buildGroupFormGroup(fb, group);
    const tuesday = form.controls.schedule.at(1);

    expect(startBeforeEndValidator(tuesday)).toBeNull();
    tuesday.patchValue({ start: '09:00' });

    expect(startBeforeEndValidator(tuesday)).toEqual({ incompleteRange: true });
    tuesday.patchValue({ start: '', end: '10:00' });
    expect(startBeforeEndValidator(tuesday)).toEqual({ incompleteRange: true });
  });

  it('requires start to be strictly earlier than end', () => {
    const form = buildGroupFormGroup(fb, group);
    const tuesday = form.controls.schedule.at(1);

    tuesday.patchValue({ start: '09:00', end: '09:00' });
    expect(startBeforeEndValidator(tuesday)).toEqual({ startAfterEnd: true });

    tuesday.patchValue({ start: '08:59', end: '09:00' });
    expect(startBeforeEndValidator(tuesday)).toBeNull();
  });

  it('requires a complete time range when LAB is selected', () => {
    const form = buildGroupFormGroup(fb, group);
    const tuesday = form.controls.schedule.at(1);

    tuesday.patchValue({ lab: true });
    expect(startBeforeEndValidator(tuesday)).toEqual({ labTimeRequired: true });

    tuesday.patchValue({ start: '09:00', end: '10:00' });
    expect(startBeforeEndValidator(tuesday)).toBeNull();
  });
});
