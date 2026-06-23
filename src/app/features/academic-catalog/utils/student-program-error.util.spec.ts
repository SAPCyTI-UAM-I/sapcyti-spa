import { FormControl, FormGroup } from '@angular/forms';

import {
  mockApiError,
  mockSpringBootNotFound,
} from '../../../core/errors/testing/mock-api-error.util';
import { BACKEND_MESSAGES } from '../../../core/errors/constants/backend-messages';
import {
  mapStudentProgramError,
  mapStudentProgramFormError,
  mapStudentProgramListError,
} from './student-program-error.util';

describe('student-program-error util', () => {
  it('maps known validation messages from the API', () => {
    const error = mockApiError({
      status: 400,
      error: 'VALIDATION_ERROR',
      message: BACKEND_MESSAGES.ACADEMIC.GRADUATION_DATE_ORDER,
    });

    expect(mapStudentProgramError(error)).toBe('date_order');
  });

  it('maps duplicate advisor ids from the API message', () => {
    const error = mockApiError({
      status: 400,
      error: 'VALIDATION_ERROR',
      message: BACKEND_MESSAGES.ACADEMIC.DUPLICATE_ADVISOR_IDS,
    });

    expect(mapStudentProgramError(error)).toBe('duplicate_advisor_ids');
  });

  it('maps withdrawal reason validation from the API', () => {
    const error = mockApiError({
      status: 400,
      error: 'VALIDATION_ERROR',
      message: BACKEND_MESSAGES.ACADEMIC.WITHDRAWAL_REASON_REQUIRED,
    });

    expect(mapStudentProgramError(error)).toBe('withdrawal_reason_required');
  });

  it('maps Spring Boot 404 without message to load_failed', () => {
    expect(mapStudentProgramError(mockSpringBootNotFound('/api/students/1/programs'))).toBe(
      'load_failed',
    );
  });

  it('maps program not found for list toast copy', () => {
    const error = mockApiError({
      status: 404,
      error: 'NOT_FOUND',
      message: BACKEND_MESSAGES.ACADEMIC.STUDENT_PROGRAM_NOT_FOUND,
    });

    expect(mapStudentProgramListError(error)).toBe('no_program');
  });

  it('maps unknown failures in list context to load_failed', () => {
    expect(mapStudentProgramListError(mockApiError({ status: 500 }))).toBe('load_failed');
  });

  it('falls back to generic validation for unknown 400 responses', () => {
    const error = mockApiError({
      status: 400,
      error: 'VALIDATION_ERROR',
      message: 'Unexpected validation issue',
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
