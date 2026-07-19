import { TrimestralPlanMockStore } from './trimestral-plan-mock.store';

describe('TrimestralPlanMockStore', () => {
  function store(): TrimestralPlanMockStore {
    return new TrimestralPlanMockStore();
  }

  it('seeds the 26I draft from the closed survey, with a blank student and warnings', () => {
    const plan = store().get(1);

    expect(plan.term).toBe('26I');
    expect(plan.status).toBe('BORRADOR');
    expect(plan.groups.length).toBeGreaterThan(0);
    // Carla answered BLANK: no group, listed apart, not exported.
    expect(plan.blankStudents.map((s) => s.enrollmentId)).toEqual(['2024630003']);
    expect(plan.warnings.some((w) => w.code === 'UEA_NO_QUOTA')).toBe(true);
  });

  it('proposes the HU-57 letter from the declared trimestre', () => {
    const plan = store().get(1);
    // Ana declared II → CP43; Elena declared IV → CR43.
    const ana = plan.groups.find((g) => g.students.some((s) => s.enrollmentId === '2024630001'));
    const elena = plan.groups.find((g) => g.students.some((s) => s.enrollmentId === '2024630005'));

    expect(ana?.grupo).toBe('CP43');
    expect(elena?.grupo).toBe('CR43');
  });

  it('refuses to generate from a survey that is not CERRADO', () => {
    expect(() => store().generate({ surveyId: 2 })).toThrowError(
      expect.objectContaining({ status: 409 }),
    );
  });

  it('refuses a second plan for the same term', () => {
    expect(() => store().generate({ surveyId: 1 })).toThrowError(
      expect.objectContaining({ status: 409 }),
    );
  });

  it('blocks edits once the plan is TERMINADA', () => {
    expect(() => store().saveGroups(2, { groups: [] })).toThrowError(
      expect.objectContaining({ status: 409 }),
    );
  });

  it('drops a blank student from the blanks list once placed in a group', () => {
    const s = store();
    const plan = s.get(1);
    const group = plan.groups[0]!;

    const saved = s.saveGroups(1, {
      groups: [
        {
          id: group.id,
          ueaId: group.ueaId,
          grupo: group.grupo,
          cupo: '*',
          professorId: null,
          schedule: group.schedule,
          obs: null,
          // 3 = Carla, the blank responder, added by hand (HU-59).
          studentIds: [...group.students.map((st) => st.studentId), 3],
        },
      ],
    });

    expect(saved.blankStudents).toEqual([]);
    const carla = saved.groups[0]!.students.find((st) => st.studentId === 3);
    expect(carla?.source).toBe('MANUAL');
    expect(carla?.academicTerm).toBeNull();
  });

  it('warns instead of blocking when a group exceeds its cupo', () => {
    const s = store();
    const group = s.get(1).groups[0]!;

    const saved = s.saveGroups(1, {
      groups: [
        {
          id: group.id,
          ueaId: group.ueaId,
          grupo: group.grupo,
          cupo: '1',
          professorId: null,
          schedule: group.schedule,
          obs: null,
          studentIds: [1, 3, 5],
        },
      ],
    });

    expect(saved.warnings.some((w) => w.code === 'CUPO_EXCEEDED')).toBe(true);
    expect(saved.groups[0]!.students).toHaveLength(3);
  });
});
