import {
  AnnualPlanEntryFormValue,
  buildSaveEntriesRequest,
  cycleMark,
  isValidCell,
  isValidCellPair,
  PROGRAM_CODES,
} from './annual-plan-cell.util';

describe('isValidCell', () => {
  it('accepts empty (null/""), "*" and positive integers', () => {
    expect(isValidCell(null)).toBe(true);
    expect(isValidCell('')).toBe(true);
    expect(isValidCell('  ')).toBe(true);
    expect(isValidCell('*')).toBe(true);
    expect(isValidCell('1')).toBe(true);
    expect(isValidCell('15')).toBe(true);
  });

  it('rejects zero, negatives, decimals and non-numeric', () => {
    expect(isValidCell('0')).toBe(false);
    expect(isValidCell('-1')).toBe(false);
    expect(isValidCell('1.5')).toBe(false);
    expect(isValidCell('abc')).toBe(false);
    expect(isValidCell('1*')).toBe(false);
  });
});

describe('isValidCellPair', () => {
  it('accepts an empty pair and complete positive or wildcard pairs', () => {
    expect(isValidCellPair(null, null)).toBe(true);
    expect(isValidCellPair('', '  ')).toBe(true);
    expect(isValidCellPair('1', '15')).toBe(true);
    expect(isValidCellPair('*', '1')).toBe(true);
    expect(isValidCellPair('2', '*')).toBe(true);
    expect(isValidCellPair('*', '*')).toBe(true);
  });

  it('rejects incomplete pairs and zero values', () => {
    expect(isValidCellPair('1', null)).toBe(false);
    expect(isValidCellPair(null, '15')).toBe(false);
    expect(isValidCellPair('0', '15')).toBe(false);
    expect(isValidCellPair('1', '0')).toBe(false);
  });
});

describe('cycleMark', () => {
  it('cycles empty → X → O → X/O → empty', () => {
    expect(cycleMark(undefined)).toBe('X');
    expect(cycleMark('X')).toBe('O');
    expect(cycleMark('O')).toBe('X/O');
    expect(cycleMark('X/O')).toBeUndefined();
  });
});

describe('buildSaveEntriesRequest', () => {
  it('normalizes empty cells to null and drops absent marks; no clave/nombre/modalidad', () => {
    const rows: AnnualPlanEntryFormValue[] = [
      {
        id: 7,
        gruposI: '1',
        cupoI: '',
        gruposP: '*',
        cupoP: '  ',
        gruposO: '2',
        cupoO: '15',
        // PCYTI is catalog-derived and must be dropped; PEMA absent; P_FIS kept.
        marks: { P_FIS: 'X', PCYTI: 'X', PEMA: undefined },
      },
    ];

    const request = buildSaveEntriesRequest(rows);

    expect(request).toEqual({
      entries: [
        {
          id: 7,
          gruposI: '1',
          cupoI: null,
          gruposP: '*',
          cupoP: null,
          gruposO: '2',
          cupoO: '15',
          marks: { P_FIS: 'X' },
        },
      ],
    });
    expect(request.entries[0]).not.toHaveProperty('clave');
    expect(request.entries[0]).not.toHaveProperty('modalidad');
    expect(request.entries[0]!.marks).not.toHaveProperty('PCYTI');
  });

  it('exposes the 9 program codes in format order', () => {
    expect(PROGRAM_CODES).toEqual([
      'P_FIS',
      'P_MAT',
      'MCMAI',
      'P_QUIM',
      'P_IQUIM',
      'P_IBIOM',
      'PCYTI',
      'PEMA',
      'EFMC',
    ]);
  });
});
