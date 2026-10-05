import { FormControl, Validators } from '@angular/forms';

import {
  applyProfessorEditLockRules,
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

  describe('applyProfessorEditLockRules (HU-24)', () => {
    it('locks type and NEMP for an interno with an assigned number', () => {
      const type = new FormControl('INTERNO', { nonNullable: true });
      const nemp = new FormControl('30910', { nonNullable: true });

      applyProfessorEditLockRules(
        { professorType: 'INTERNO', employeeNumber: '30910' },
        type,
        nemp,
      );

      expect(type.disabled).toBe(true);
      expect(nemp.disabled).toBe(true);
    });

    it('keeps type editable for an externo (can become interno)', () => {
      const type = new FormControl('EXTERNO', { nonNullable: true });
      const nemp = new FormControl('', { nonNullable: true });

      applyProfessorEditLockRules({ professorType: 'EXTERNO', employeeNumber: null }, type, nemp);

      expect(type.enabled).toBe(true);
      expect(nemp.enabled).toBe(true);
    });
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
