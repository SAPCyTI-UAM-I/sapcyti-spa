import { allowedActions, statusTagSeverity } from './enrollment-survey-status.util';

describe('enrollment-survey-status.util', () => {
  it('maps each status to a tag severity', () => {
    expect(statusTagSeverity('PROGRAMADO')).toBe('info');
    expect(statusTagSeverity('ACTIVO')).toBe('success');
    expect(statusTagSeverity('CERRADO')).toBe('secondary');
  });

  it('offers edit + delete for a PROGRAMADO survey without responses', () => {
    expect(allowedActions('PROGRAMADO', 0).map((a) => a.action)).toEqual(['edit', 'delete']);
  });

  it('hides delete once a PROGRAMADO survey has responses', () => {
    expect(allowedActions('PROGRAMADO', 3).map((a) => a.action)).toEqual(['edit']);
  });

  it('offers only edit while ACTIVO (close lives on the edit screen)', () => {
    expect(allowedActions('ACTIVO', 5).map((a) => a.action)).toEqual(['edit']);
  });

  it('offers only edit once CERRADO (reopen lives on the edit screen)', () => {
    expect(allowedActions('CERRADO', 5).map((a) => a.action)).toEqual(['edit']);
  });
});
