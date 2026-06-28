import {
  programStatusSeverity,
  programTypeTagSeverity,
  studentActiveTagSeverity,
} from './catalog-tag.util';

describe('catalog-tag.util', () => {
  it('maps program types to catalog tag severities', () => {
    expect(programTypeTagSeverity('MAESTRIA')).toBe('maestria');
    expect(programTypeTagSeverity('DOCTORADO')).toBe('doctorado');
  });

  it('maps student account active flag to catalog tag severities', () => {
    expect(studentActiveTagSeverity(true)).toBe('success');
    expect(studentActiveTagSeverity(false)).toBe('secondary');
  });

  it('maps program status to catalog tag severities', () => {
    expect(programStatusSeverity('ACTIVO')).toBe('success');
    expect(programStatusSeverity('BAJA')).toBe('warn');
    expect(programStatusSeverity('EGRESADO')).toBe('info');
  });
});
