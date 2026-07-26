import { FormBuilder, NonNullableFormBuilder } from '@angular/forms';

import { TrimestralGroup } from '../../../models';
import { buildGroupFormGroup } from './group-form.util';
import { collectGroupIssues } from './plan-issues.util';

const fb: NonNullableFormBuilder = new FormBuilder().nonNullable;

describe('collectGroupIssues', () => {
  const group = (overrides: Partial<TrimestralGroup> = {}): TrimestralGroup => ({
    id: 1,
    ueaId: 7,
    clave: '2156024',
    nombre: 'REDES Y PROTOCOLOS',
    tipoUea: 'OBLIGATORIA',
    grupo: 'CO43',
    cupo: '15',
    maxGroups: '2',
    professors: [],
    schedule: [
      { day: 'LUN', start: null, end: null, lab: false },
      { day: 'MAR', start: null, end: null, lab: false },
      { day: 'MIE', start: null, end: null, lab: false },
      { day: 'JUE', start: null, end: null, lab: false },
      { day: 'VIE', start: null, end: null, lab: false },
    ],
    students: [],
    ...overrides,
  });

  it('has nothing to report on a well-formed group', () => {
    const form = buildGroupFormGroup(fb, group());
    form.controls.schedule.at(0).patchValue({ start: '09:30', end: '11:00' });

    expect(collectGroupIssues([form], [], [])).toEqual([]);
  });

  it('names the day of a LAB marked without a schedule', () => {
    const form = buildGroupFormGroup(fb, group());
    form.controls.schedule.at(2).patchValue({ lab: true });

    const [issue, ...rest] = collectGroupIssues([form], [], []);

    expect(rest).toEqual([]);
    expect(issue).toMatchObject({
      index: 0,
      clave: '2156024',
      grupo: 'CO43',
      key: 'TRIMESTRAL_PLANNING.ISSUES.LAB_TIME_REQUIRED',
      dayKey: 'TRIMESTRAL_PLANNING.DAYS.MIE',
    });
  });

  /** Media captura es el caso frecuente, y no es lo mismo que falte el inicio o el fin. */
  it('distinguishes a missing end from a missing start', () => {
    const form = buildGroupFormGroup(fb, group());
    form.controls.schedule.at(0).patchValue({ start: '09:30' });
    form.controls.schedule.at(1).patchValue({ end: '11:00' });

    expect(collectGroupIssues([form], [], []).map((issue) => issue.key)).toEqual([
      'TRIMESTRAL_PLANNING.ISSUES.MISSING_END',
      'TRIMESTRAL_PLANNING.ISSUES.MISSING_START',
    ]);
  });

  it('reports an inverted range with both hours', () => {
    const form = buildGroupFormGroup(fb, group());
    form.controls.schedule.at(4).patchValue({ start: '11:00', end: '09:00' });

    expect(collectGroupIssues([form], [], [])[0]).toMatchObject({
      key: 'TRIMESTRAL_PLANNING.ISSUES.START_AFTER_END',
      dayKey: 'TRIMESTRAL_PLANNING.DAYS.VIE',
      params: { start: '11:00', end: '09:00' },
    });
  });

  it('carries the numbers behind the capacity and group limits', () => {
    const form = buildGroupFormGroup(
      fb,
      group({
        cupo: '1',
        students: [
          {
            studentId: 1,
            enrollmentId: '2262000001',
            fullName: 'A',
            obs: null,
            source: 'SURVEY',
            academicTerm: null,
          },
          {
            studentId: 2,
            enrollmentId: '2262000002',
            fullName: 'B',
            obs: null,
            source: 'SURVEY',
            academicTerm: null,
          },
        ],
      }),
    );

    expect(collectGroupIssues([form], [0], [0])).toMatchObject([
      {
        key: 'TRIMESTRAL_PLANNING.ISSUES.OVER_CAPACITY',
        params: { students: 2, cupo: '1' },
      },
      { key: 'TRIMESTRAL_PLANNING.ISSUES.GROUP_LIMIT', params: { max: '2' } },
    ]);
  });

  it('flags a stored time that the contract would reject', () => {
    const form = buildGroupFormGroup(fb, group());
    form.controls.schedule.at(0).patchValue({ start: '9:30', end: '11:00' });

    expect(collectGroupIssues([form], [], [])).toMatchObject([
      { key: 'TRIMESTRAL_PLANNING.ISSUES.TIME_FORMAT', params: { value: '9:30' } },
    ]);
  });

  it('keeps the index of each group so the panel can jump to it', () => {
    const first = buildGroupFormGroup(fb, group());
    const second = buildGroupFormGroup(fb, group({ grupo: 'CO43A' }));
    second.controls.schedule.at(0).patchValue({ lab: true });

    expect(collectGroupIssues([first, second], [], [])).toMatchObject([
      { index: 1, grupo: 'CO43A' },
    ]);
  });
});
