import { FormGroup } from '@angular/forms';

import { getApiErrorMessage, getHttpStatus } from '../../../core/http/utils/parse-api-error.util';

export type StudentProgramError =
  | 'program_not_found'
  | 'professor_not_found'
  | 'date_order'
  | 'withdrawal_reason_required'
  | 'duplicate_advisor_ids'
  | 'validation'
  | 'server';

const VALIDATION_MESSAGE_MAP: Record<string, StudentProgramError> = {
  'Graduation date must be on or after admission date': 'date_order',
  'Withdrawal reason is required when status is BAJA': 'withdrawal_reason_required',
  'Advisor ids must be unique': 'duplicate_advisor_ids',
};

export function mapStudentProgramValidationMessage(
  message: string | undefined,
): StudentProgramError | null {
  if (!message) {
    return null;
  }

  return VALIDATION_MESSAGE_MAP[message] ?? null;
}

export function mapStudentProgramError(error: unknown): StudentProgramError {
  const message = getApiErrorMessage(error);

  if (message === 'Student program not found') {
    return 'program_not_found';
  }

  if (message === 'Professor not found') {
    return 'professor_not_found';
  }

  const validationError = mapStudentProgramValidationMessage(message);
  if (validationError) {
    return validationError;
  }

  if (getHttpStatus(error) === 400) {
    return 'validation';
  }

  return 'server';
}

export function mapStudentProgramFormError(form: FormGroup): StudentProgramError | null {
  if (form.hasError('GRADUATION_BEFORE_ADMISSION')) {
    return 'date_order';
  }

  if (form.hasError('WITHDRAWAL_REASON_REQUIRED')) {
    return 'withdrawal_reason_required';
  }

  if (form.controls['advisorIds']?.hasError('DUPLICATE_ADVISOR_IDS')) {
    return 'duplicate_advisor_ids';
  }

  return 'validation';
}
