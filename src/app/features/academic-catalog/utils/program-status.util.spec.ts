import { programStatusSeverity } from './program-status.util';

describe('programStatusSeverity', () => {
  it('maps each status to its PrimeNG tag severity', () => {
    expect(programStatusSeverity('ACTIVO')).toBe('success');
    expect(programStatusSeverity('EN_INVESTIGACION')).toBe('info');
    expect(programStatusSeverity('EGRESADO')).toBe('info');
    expect(programStatusSeverity('BAJA')).toBe('warn');
    expect(programStatusSeverity('SUSPENSION')).toBe('warn');
  });
});
