import {
  isAdjacent,
  nextStatuses,
  statusActionLabelKey,
  statusTagSeverity,
} from './annual-plan-status.util';

describe('statusTagSeverity', () => {
  it('maps each status to a badge severity', () => {
    expect(statusTagSeverity('BORRADOR')).toBe('warn');
    expect(statusTagSeverity('TERMINADA')).toBe('success');
    expect(statusTagSeverity('ARCHIVADA')).toBe('secondary');
  });
});

describe('nextStatuses', () => {
  it('returns only adjacent states', () => {
    expect(nextStatuses('BORRADOR')).toEqual(['TERMINADA']);
    expect(nextStatuses('TERMINADA')).toEqual(['BORRADOR', 'ARCHIVADA']);
    expect(nextStatuses('ARCHIVADA')).toEqual(['TERMINADA']);
  });
});

describe('isAdjacent', () => {
  it('is true only for neighbouring states', () => {
    expect(isAdjacent('BORRADOR', 'TERMINADA')).toBe(true);
    expect(isAdjacent('TERMINADA', 'ARCHIVADA')).toBe(true);
    expect(isAdjacent('BORRADOR', 'ARCHIVADA')).toBe(false);
    expect(isAdjacent('BORRADOR', 'BORRADOR')).toBe(false);
  });
});

describe('statusActionLabelKey', () => {
  it('names each transition by current + target', () => {
    expect(statusActionLabelKey('BORRADOR', 'TERMINADA')).toBe('ANNUAL_PLANNING.ACTIONS.FINISH');
    expect(statusActionLabelKey('TERMINADA', 'ARCHIVADA')).toBe('ANNUAL_PLANNING.ACTIONS.ARCHIVE');
    expect(statusActionLabelKey('TERMINADA', 'BORRADOR')).toBe('ANNUAL_PLANNING.ACTIONS.REOPEN');
    expect(statusActionLabelKey('ARCHIVADA', 'TERMINADA')).toBe(
      'ANNUAL_PLANNING.ACTIONS.UNARCHIVE',
    );
  });
});
