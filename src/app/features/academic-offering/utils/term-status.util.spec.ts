import { termStatusSeverity } from './term-status.util';

describe('termStatusSeverity', () => {
  it('maps each status to its PrimeNG tag severity', () => {
    expect(termStatusSeverity('PRELIMINARY')).toBe('warn');
    expect(termStatusSeverity('EDITED')).toBe('success');
    expect(termStatusSeverity('IN_ENROLLMENT')).toBe('info');
  });
});
