import { TrimestralPlanMockStore } from './trimestral-plan-mock.store';

describe('TrimestralPlanMockStore', () => {
  function store(): TrimestralPlanMockStore {
    return new TrimestralPlanMockStore();
  }

  function saveRequest(plan: ReturnType<TrimestralPlanMockStore['get']>) {
    return {
      groups: plan.groups.map((group) => ({
        id: group.id,
        ueaId: group.ueaId,
        grupo: group.grupo,
        cupo: group.cupo,
        professorIds: group.professors.map((professor) => professor.professorId),
        schedule: group.schedule,
        students: group.students.map((student) => ({
          studentId: student.studentId,
          obs: student.obs,
        })),
      })),
    };
  }

  it('seeds the 26I draft from the closed survey, with a blank student and warnings', () => {
    const plan = store().get(1);

    expect(plan.term).toBe('26I');
    expect(plan.status).toBe('BORRADOR');
    expect(plan.groups.length).toBeGreaterThan(0);
    // Carla answered BLANK: no group, listed apart, not exported.
    expect(plan.blankStudents.map((s) => s.enrollmentId)).toEqual(['2024630003']);
    expect(plan.unassignedDemand.some((item) => item.reason === 'UEA_NOT_OFFERED')).toBe(true);
  });

  it('mixes ordinary demand into the CO43 base group', () => {
    const plan = store().get(1);
    // Ordinary UEAs share CO43 regardless of the declared academic term.
    const ana = plan.groups.find((g) => g.students.some((s) => s.enrollmentId === '2024630001'));
    const elena = plan.groups.find((g) => g.students.some((s) => s.enrollmentId === '2024630005'));

    expect(ana?.grupo).toBe('CO43');
    expect(elena?.grupo).toBe('CO43');
  });

  it('seeds a plan with the outdated badge and an inactive professor already assigned', () => {
    const plan = store().get(3);

    expect(plan.outdated).toBe(true);
    expect(plan.warnings.some((w) => w.code === 'PROFESSOR_INACTIVE')).toBe(true);
  });

  it('only offers active professors and active UEAs in the pickers', () => {
    const s = store();

    expect(s.searchProfessors('').content.every((p) => p.active)).toBe(true);
    expect(s.searchProfessors('40004').content).toEqual([]);
    expect(s.searchUeas('').content.every((u) => u.active)).toBe(true);
  });

  it('blocks writes while the source survey is reopened', () => {
    const mockStore = store();
    const existing = mockStore.get(3).groups[0]!;

    expect(() =>
      mockStore.saveGroups(3, {
        groups: [
          {
            id: existing.id,
            ueaId: existing.ueaId,
            grupo: existing.grupo,
            cupo: existing.cupo,
            professorIds: [4],
            schedule: existing.schedule,
            students: existing.students.map((student) => ({
              studentId: student.studentId,
              obs: student.obs,
            })),
          },
        ],
      }),
    ).toThrowError(expect.objectContaining({ status: 409 }));
  });

  it('warns STUDENT_INACTIVE for someone dropped after answering, without removing them', () => {
    const plan = store().get(1);

    // Elena (2024630005) está de baja en el padrón compartido pero respondió el sondeo.
    expect(
      plan.warnings.some((w) => w.code === 'STUDENT_INACTIVE' && w.enrollmentId === '2024630005'),
    ).toBe(true);
    expect(plan.groups.some((g) => g.students.some((s) => s.enrollmentId === '2024630005'))).toBe(
      true,
    );
  });

  it('offers only active students in the picker (HU-59)', () => {
    const found = store().searchStudents('2024630005').content;

    expect(found).toEqual([]);
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

  it('warns NO_RESPONSES when the survey only got blank enrollments (HU-58)', () => {
    const plan = store().generate({ surveyId: 4 });

    expect(plan.groups).toEqual([]);
    expect(plan.warnings.some((w) => w.code === 'NO_RESPONSES')).toBe(true);
    expect(plan.blankStudents).toHaveLength(1);
  });

  it('refuses to generate when the term year has no annual plan (HU-58)', () => {
    expect(() => store().generate({ surveyId: 5 })).toThrowError(
      expect.objectContaining({ status: 409 }),
    );
  });

  it('warns UEA_DEACTIVATED for a UEA chosen and later removed from the catalog', () => {
    const plan = store().get(1);

    expect(plan.warnings.some((w) => w.code === 'UEA_DEACTIVATED')).toBe(true);
    // La demanda se conserva: el coordinador decide si la elimina durante la edición.
    expect(plan.groups.some((g) => g.ueaId === 36)).toBe(true);
  });

  it('blocks edits once the plan is TERMINADA', () => {
    expect(() => store().saveGroups(2, { groups: [] })).toThrowError(
      expect.objectContaining({ status: 409 }),
    );
  });

  it('exports BORRADOR and TERMINADA plans and preserves exportedAt after reopening', () => {
    const mockStore = store();

    expect(mockStore.export(1)).toBeInstanceOf(Blob);
    expect(mockStore.get(1).exportedAt).not.toBeNull();

    mockStore.changeStatus(1, { status: 'TERMINADA' });
    mockStore.export(1);
    const exportedAt = mockStore.get(1).exportedAt;
    expect(exportedAt).not.toBeNull();

    mockStore.changeStatus(1, { status: 'BORRADOR' });
    expect(mockStore.get(1).exportedAt).toBe(exportedAt);
    expect(mockStore.get(1).exportedAt).toBe(exportedAt);
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
          professorIds: [],
          schedule: group.schedule,
          // 3 = Carla, the blank responder, added by hand (HU-59).
          students: [
            ...group.students.map((st) => ({ studentId: st.studentId, obs: st.obs })),
            { studentId: 3, obs: 'PIB' },
          ],
        },
      ],
    });

    expect(saved.blankStudents).toEqual([]);
    const carla = saved.groups[0]!.students.find((st) => st.studentId === 3);
    expect(carla?.source).toBe('MANUAL');
    expect(carla?.academicTerm).toBeNull();
    // La nota por alumno (col AB del Excel) sí se escribe y persiste.
    expect(carla?.obs).toBe('PIB');
  });

  it('reconciles manual removals and clears them after reassignment', () => {
    const s = store();
    const original = s.get(1);
    const target = original.groups.find((group) =>
      group.students.some((student) => student.studentId === 1),
    )!;
    const removed = saveRequest(original);
    removed.groups.find((group) => group.id === target.id)!.students = [];

    const saved = s.saveGroups(1, removed);
    expect(
      saved.unassignedDemand.some(
        (item) =>
          item.ueaId === target.ueaId &&
          item.studentId === 1 &&
          item.reason === 'MANUALLY_UNASSIGNED',
      ),
    ).toBe(true);

    const reassigned = saveRequest(saved);
    reassigned.groups
      .find((group) => group.id === target.id)!
      .students.push({
        studentId: 1,
        obs: null,
      });
    const savedAgain = s.saveGroups(1, reassigned);
    expect(
      savedAgain.unassignedDemand.some(
        (item) => item.ueaId === target.ueaId && item.studentId === 1,
      ),
    ).toBe(false);
  });

  it('does not allow restoring an inactive student after manual removal', () => {
    const s = store();
    const original = s.get(1);
    const target = original.groups.find((group) =>
      group.students.some((student) => student.studentId === 5),
    )!;
    const removed = saveRequest(original);
    removed.groups.find((group) => group.id === target.id)!.students = [];
    const saved = s.saveGroups(1, removed);
    const restore = saveRequest(saved);
    restore.groups
      .find((group) => group.id === target.id)!
      .students.push({
        studentId: 5,
        obs: null,
      });

    expect(() => s.saveGroups(1, restore)).toThrowError(expect.objectContaining({ status: 409 }));
  });

  it('blocks saving when a group exceeds its cupo', () => {
    const s = store();
    const group = s.get(1).groups[0]!;

    expect(() =>
      s.saveGroups(1, {
        groups: [
          {
            id: group.id,
            ueaId: group.ueaId,
            grupo: group.grupo,
            cupo: '1',
            professorIds: [],
            schedule: group.schedule,
            students: [1, 3, 5].map((studentId) => ({ studentId, obs: null })),
          },
        ],
      }),
    ).toThrowError(expect.objectContaining({ status: 400 }));
  });
});
