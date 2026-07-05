import { FormControl, FormGroup } from '@angular/forms';

import {
  buildUpdateStudentProgramRequest,
  buildUpdateStudentRequest,
  graduationDateAfterAdmissionValidator,
  reconcileProgramCatalogSelection,
  StudentEditFormValue,
  uniqueAdvisorIdsValidator,
  withdrawalReasonWhenBajaValidator,
} from './student-program-form.util';

const baseFormValue: StudentEditFormValue = {
  firstName: '  Ada  ',
  firstLastName: '  Lovelace  ',
  secondLastName: '   ',
  email: '  ada@example.com ',
  nationality: ' Británica ',
  birthDate: '1990-12-10',
  phone: ' 5512345678 ',
  phoneExtension: '   ',
  undergraduateDegree: ' Matemáticas ',
  lastDegreeObtained: 'MAESTRIA',
  programType: 'MAESTRIA',
  admissionDate: '2025-09-01',
  active: true,
  graduationDate: '   ',
  status: 'ACTIVO',
  withdrawalReason: ' irrelevante ',
  lineOfKnowledge: '',
  researchArea: '',
  tutorId: null,
  advisorIds: [],
};

describe('student-program-form validators', () => {
  it('requires withdrawal reason when status is BAJA', () => {
    const group = new FormGroup({
      status: new FormControl('BAJA'),
      withdrawalReason: new FormControl(''),
    });

    expect(withdrawalReasonWhenBajaValidator()(group)).toEqual({
      WITHDRAWAL_REASON_REQUIRED: true,
    });

    group.get('withdrawalReason')?.setValue('Motivo de baja');
    expect(withdrawalReasonWhenBajaValidator()(group)).toBeNull();
  });

  it('allows empty withdrawal reason when status is not BAJA', () => {
    const group = new FormGroup({
      status: new FormControl('ACTIVO'),
      withdrawalReason: new FormControl(''),
    });

    expect(withdrawalReasonWhenBajaValidator()(group)).toBeNull();
  });

  it('requires graduation date on or after admission date', () => {
    const group = new FormGroup({
      admissionDate: new FormControl('2025-09-01'),
      graduationDate: new FormControl('2025-01-01'),
    });

    expect(graduationDateAfterAdmissionValidator()(group)).toEqual({
      GRADUATION_BEFORE_ADMISSION: true,
    });

    group.get('graduationDate')?.setValue('2026-06-01');
    expect(graduationDateAfterAdmissionValidator()(group)).toBeNull();
  });

  it('rejects duplicate advisor ids', () => {
    const control = new FormControl([10, 11, 10]);

    expect(uniqueAdvisorIdsValidator()(control)).toEqual({
      DUPLICATE_ADVISOR_IDS: true,
    });

    control.setValue([10, 11]);
    expect(uniqueAdvisorIdsValidator()(control)).toBeNull();
  });
});

describe('student update payload builders', () => {
  it('trims student fields and drops blank optionals', () => {
    const body = buildUpdateStudentRequest(baseFormValue);

    expect(body.firstName).toBe('Ada');
    expect(body.email).toBe('ada@example.com');
    expect(body.secondLastName).toBeUndefined();
    expect(body.phoneExtension).toBeUndefined();
    expect(body.active).toBe(true);
  });

  it('only includes withdrawal reason when status is BAJA', () => {
    expect(buildUpdateStudentProgramRequest(baseFormValue).withdrawalReason).toBeUndefined();

    const baja = buildUpdateStudentProgramRequest({
      ...baseFormValue,
      status: 'BAJA',
      withdrawalReason: ' Cambio de programa ',
    });
    expect(baja.withdrawalReason).toBe('Cambio de programa');
  });

  it('omits blank graduation date and empty line/area', () => {
    const body = buildUpdateStudentProgramRequest(baseFormValue);

    expect(body.graduationDate).toBeUndefined();
    expect(body.lineOfKnowledge).toBeUndefined();
    expect(body.researchArea).toBeUndefined();
  });
});

describe('reconcileProgramCatalogSelection', () => {
  const catalog = [{ line: 'COMPUTER_SCIENCE', areas: ['AI', 'NETWORKS'] }];

  it('keeps a valid line/area pair', () => {
    expect(reconcileProgramCatalogSelection(catalog, 'COMPUTER_SCIENCE', 'AI')).toEqual({
      line: 'COMPUTER_SCIENCE',
      area: 'AI',
    });
  });

  it('clears both when the line no longer exists', () => {
    expect(reconcileProgramCatalogSelection(catalog, 'OBSOLETE', 'AI')).toEqual({
      line: '',
      area: '',
    });
  });

  it('clears only the area when it does not belong to the line', () => {
    expect(reconcileProgramCatalogSelection(catalog, 'COMPUTER_SCIENCE', 'BIOLOGY')).toEqual({
      line: 'COMPUTER_SCIENCE',
      area: '',
    });
  });
});
