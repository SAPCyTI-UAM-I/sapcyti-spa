import { FormBuilder, NonNullableFormBuilder } from '@angular/forms';

import { SCHEDULE_DAYS, TrimestralGroup } from '../../../models';
import { buildGroupFormGroup, buildStudentRow } from './group-form.util';
import { computePlanSummary } from './plan-summary.util';

const fb: NonNullableFormBuilder = new FormBuilder().nonNullable;

function group(overrides: Partial<TrimestralGroup> = {}): TrimestralGroup {
  return {
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
    ...overrides,
  };
}

describe('computePlanSummary', () => {
  it('counts groups, placed enrolments and what is left', () => {
    const complete = buildGroupFormGroup(fb, group());
    complete.controls.students.push(buildStudentRow(fb, 1));
    complete.controls.students.push(buildStudentRow(fb, 2));
    const incomplete = buildGroupFormGroup(fb, group({ professors: [] }));

    const summary = computePlanSummary([complete, incomplete], 4, new Set([1]));

    expect(summary).toEqual({
      groups: 2,
      assignedStudents: 2,
      unassignedStudents: 4,
      incompleteGroups: 1,
      groupsWithProblems: 1,
    });
  });

  it('reads as empty for a plan with no groups', () => {
    expect(computePlanSummary([], 0, new Set())).toEqual({
      groups: 0,
      assignedStudents: 0,
      unassignedStudents: 0,
      incompleteGroups: 0,
      groupsWithProblems: 0,
    });
  });
});
