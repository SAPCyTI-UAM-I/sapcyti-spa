import {
  baseGroupForTerm,
  compareByLastNames,
  groupLetterForTerm,
  groupWithSuffix,
  nextGroupLetter,
} from './group-letter.util';

describe('group-letter.util (HU-57)', () => {
  it('maps trimestres I..IX to letters O..W', () => {
    expect(groupLetterForTerm('I')).toBe('O');
    expect(groupLetterForTerm('II')).toBe('P');
    expect(groupLetterForTerm('VI')).toBe('T');
    expect(groupLetterForTerm('IX')).toBe('W');
  });

  it('gives no letter from trimestre X onwards, nor for a blank term', () => {
    expect(groupLetterForTerm('X')).toBeNull();
    expect(groupLetterForTerm('XII')).toBeNull();
    expect(groupLetterForTerm(null)).toBeNull();
  });

  it('builds the base group as C + letter + 43', () => {
    expect(baseGroupForTerm('I')).toBe('CO43');
    expect(baseGroupForTerm('IV')).toBe('CR43');
    expect(baseGroupForTerm('XI')).toBeNull();
  });

  it('suffixes repeated groups A, B, … keeping the first unsuffixed', () => {
    expect(groupWithSuffix('CR43', 0)).toBe('CR43');
    expect(groupWithSuffix('CR43', 1)).toBe('CR43A');
    expect(groupWithSuffix('CR43', 2)).toBe('CR43B');
    expect(groupWithSuffix('CR43', 26)).toBe('CR43Z');
    expect(() => groupWithSuffix('CR43', 27)).toThrowError(RangeError);
  });

  it('orders students by last names, then first name', () => {
    const zamora = { firstLastName: 'Zamora', secondLastName: 'Ruiz', firstName: 'Ana' };
    const alvarezB = { firstLastName: 'Álvarez', secondLastName: 'Bravo', firstName: 'Luis' };
    const alvarezC = { firstLastName: 'Álvarez', secondLastName: 'Cruz', firstName: 'Ana' };

    expect([zamora, alvarezC, alvarezB].sort(compareByLastNames)).toEqual([
      alvarezB,
      alvarezC,
      zamora,
    ]);
  });

  it('uses enrollment id as the final deterministic tie-breaker', () => {
    const people = [
      {
        firstLastName: 'Pérez',
        secondLastName: 'López',
        firstName: 'Ana',
        enrollmentId: '2200000002',
      },
      {
        firstLastName: 'Pérez',
        secondLastName: 'López',
        firstName: 'Ana',
        enrollmentId: '2200000001',
      },
    ];

    expect(people.sort(compareByLastNames).map((person) => person.enrollmentId)).toEqual([
      '2200000001',
      '2200000002',
    ]);
  });

  it('sends a missing second last name to the end, not to the front (HU-57)', () => {
    const sinSegundo = { firstLastName: 'Álvarez', firstName: 'Luis' };
    const conSegundo = { firstLastName: 'Álvarez', secondLastName: 'Bravo', firstName: 'Ana' };

    expect([sinSegundo, conSegundo].sort(compareByLastNames)).toEqual([conSegundo, sinSegundo]);
    expect([conSegundo, sinSegundo].sort(compareByLastNames)).toEqual([conSegundo, sinSegundo]);
  });

  it('assigns CR43, CR43A, CR43B by last name for a cupo-1 UEA', () => {
    const students = [
      { firstLastName: 'Ramos', firstName: 'C' },
      { firstLastName: 'Aguirre', firstName: 'A' },
      { firstLastName: 'López', firstName: 'B' },
    ].sort(compareByLastNames);

    const groups = students.map((_, index) => groupWithSuffix(baseGroupForTerm('IV')!, index));

    expect(students.map((s) => s.firstLastName)).toEqual(['Aguirre', 'López', 'Ramos']);
    expect(groups).toEqual(['CR43', 'CR43A', 'CR43B']);
  });

  // Alta manual de otra sección: la letra se deduce de los hermanos existentes.
  it('proposes the next free suffix for a UEA that already has groups', () => {
    expect(nextGroupLetter(['CR43'])).toBe('CR43A');
    expect(nextGroupLetter(['CR43', 'CR43A'])).toBe('CR43B');
    // El orden en que llegan no importa, ni el capitalizado.
    expect(nextGroupLetter(['cr43b', 'CR43', 'CR43A'])).toBe('CR43C');
  });

  it('fills a freed suffix instead of skipping it', () => {
    expect(nextGroupLetter(['CR43', 'CR43B'])).toBe('CR43A');
  });

  it('has nothing to propose without siblings, so the letter is captured by hand', () => {
    expect(nextGroupLetter([])).toBeNull();
    expect(nextGroupLetter([null, ''])).toBeNull();
  });
});
