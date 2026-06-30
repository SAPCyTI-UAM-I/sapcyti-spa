import { FormControl, Validators } from '@angular/forms';

import {
  applyProfessorTypeEmployeeRules,
  buildRegisterProfessorRequest,
  buildUpdateProfessorRequest,
  normalizeProfessorEmployeeNumber,
  sabbaticalDateOrderValidator,
} from './professor-form.util';

describe('professor-form.util', () => {
  it('requires employee number for interno and clears it for externo', () => {
    const control = new FormControl('30568', { nonNullable: true });

    applyProfessorTypeEmployeeRules('EXTERNO', control);
    expect(control.disabled).toBe(true);
    expect(control.value).toBe('');

    applyProfessorTypeEmployeeRules('INTERNO', control);
    expect(control.enabled).toBe(true);
    expect(control.hasValidator(Validators.required)).toBe(true);
  });

  it('builds register and update payloads with normalized employee number', () => {
    expect(
      buildRegisterProfessorRequest({
        professorType: 'EXTERNO',
        employeeNumber: '123',
        email: 'externo@uam.mx',
        graduateProgramId: 1,
        firstName: 'Carlos',
        firstLastName: 'Externo',
        phone: '5510101010',
        commissionMember: false,
      }).employeeNumber,
    ).toBeNull();

    expect(
      buildUpdateProfessorRequest({
        professorType: 'INTERNO',
        employeeNumber: ' 40001 ',
        email: 'interno@uam.mx',
        firstName: 'Ana',
        firstLastName: 'Interna',
        phone: '5510101010',
        commissionMember: true,
      }).employeeNumber,
    ).toBe('40001');
  });

  it('normalizes employee numbers by professor type', () => {
    expect(normalizeProfessorEmployeeNumber('INTERNO', ' 123 ')).toBe('123');
    expect(normalizeProfessorEmployeeNumber('EXTERNO', '123')).toBeNull();
  });

  it('validates sabbatical date order', () => {
    expect(sabbaticalDateOrderValidator('2026-01-01', '2026-06-01')).toBe(true);
    expect(sabbaticalDateOrderValidator('2026-06-01', '2026-01-01')).toBe(false);
  });
});
