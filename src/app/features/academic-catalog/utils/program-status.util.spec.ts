import { programStatusSeverity } from './program-status.util';

describe('programStatusSeverity', () => {
  it('maps each status to its PrimeNG tag severity', () => {
    expect(programStatusSeverity('ACTIVO')).toBe('success');
    expect(programStatusSeverity('BAJA')).toBe('warn');
    expect(programStatusSeverity('EGRESADO')).toBe('info');
  });
});
