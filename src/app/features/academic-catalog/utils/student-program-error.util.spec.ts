import { FormControl, FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import {
  mapStudentProgramError,
  mapStudentProgramFormError,
  mapStudentProgramValidationMessage,
} from './student-program-error.util';

describe('student-program-error util', () => {
  it('maps known validation messages from the API', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        error: 'VALIDATION_ERROR',
        message: 'Graduation date must be on or after admission date',
      },
    });

    expect(
      mapStudentProgramValidationMessage('Graduation date must be on or after admission date'),
    ).toBe('date_order');
    expect(mapStudentProgramError(error)).toBe('date_order');
  });

  it('maps withdrawal reason validation from the API', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        error: 'VALIDATION_ERROR',
        message: 'Withdrawal reason is required when status is BAJA',
      },
    });

    expect(mapStudentProgramError(error)).toBe('withdrawal_reason_required');
  });

  it('falls back to generic validation for unknown 400 responses', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { error: 'VALIDATION_ERROR', message: 'Unexpected validation issue' },
    });

    expect(mapStudentProgramError(error)).toBe('validation');
  });

  it('maps form-level validation errors to specific keys', () => {
    const group = new FormGroup({
      admissionDate: new FormControl('2025-09-01'),
      graduationDate: new FormControl('2025-01-01'),
      advisorIds: new FormControl([10, 10]),
      status: new FormControl('ACTIVO'),
      withdrawalReason: new FormControl(''),
    });

    group.setErrors({ GRADUATION_BEFORE_ADMISSION: true });
    expect(mapStudentProgramFormError(group)).toBe('date_order');

    group.setErrors({ WITHDRAWAL_REASON_REQUIRED: true });
    expect(mapStudentProgramFormError(group)).toBe('withdrawal_reason_required');

    group.setErrors(null);
    group.get('advisorIds')?.setErrors({ DUPLICATE_ADVISOR_IDS: true });
    expect(mapStudentProgramFormError(group)).toBe('duplicate_advisor_ids');
  });
});
