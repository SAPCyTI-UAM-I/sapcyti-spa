import { FormControl, FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { BACKEND_MESSAGES } from '../../../core/errors/constants/backend-messages';
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
        message: BACKEND_MESSAGES.ACADEMIC.GRADUATION_DATE_ORDER,
      },
    });

    expect(
      mapStudentProgramValidationMessage(BACKEND_MESSAGES.ACADEMIC.GRADUATION_DATE_ORDER),
    ).toBe('date_order');
    expect(mapStudentProgramError(error)).toBe('date_order');
  });

  it('maps duplicate advisor ids from the API message', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        error: 'VALIDATION_ERROR',
        message: BACKEND_MESSAGES.ACADEMIC.DUPLICATE_ADVISOR_IDS,
      },
    });

    expect(mapStudentProgramError(error)).toBe('duplicate_advisor_ids');
  });

  it('maps withdrawal reason validation from the API', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        error: 'VALIDATION_ERROR',
        message: BACKEND_MESSAGES.ACADEMIC.WITHDRAWAL_REASON_REQUIRED,
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
