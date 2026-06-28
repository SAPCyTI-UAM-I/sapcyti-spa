import { FormControl, FormGroup } from '@angular/forms';

import {
  graduationDateAfterAdmissionValidator,
  uniqueAdvisorIdsValidator,
  withdrawalReasonWhenBajaValidator,
} from './student-program-form.util';

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
