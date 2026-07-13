import { statusTagSeverity } from './enrollment-survey-status.util';

describe('enrollment-survey-status.util', () => {
  it('maps each status to a tag severity', () => {
    expect(statusTagSeverity('PROGRAMADO')).toBe('info');
    expect(statusTagSeverity('ACTIVO')).toBe('success');
    expect(statusTagSeverity('CERRADO')).toBe('secondary');
  });
});
