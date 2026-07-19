import {
  baseGroupForTerm,
  compareByLastNames,
  groupLetterForTerm,
  groupWithSuffix,
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
});
