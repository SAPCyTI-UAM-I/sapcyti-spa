import { FormGroup } from '@angular/forms';

import { BACKEND_MESSAGES } from '../../../core/errors/constants/backend-messages';
import {
  createDomainErrorMapper,
  matchMessage,
  matchNotFound,
  matchStatus,
  matchValidation,
} from '../../../core/errors/utils/create-domain-error-mapper.util';

export const STUDENT_PROGRAM_ERROR_I18N_SCOPE = 'ACADEMIC_CATALOG.STUDENT_PROGRAM.ERRORS' as const;

export type StudentProgramError =
  | 'program_not_found'
  | 'professor_not_found'
  | 'student_not_found'
  | 'date_order'
  | 'withdrawal_reason_required'
  | 'duplicate_advisor_ids'
  | 'validation'
  | 'load_failed'
  | 'no_program'
  | 'server';

const VALIDATION_MESSAGE_MAP: Record<string, StudentProgramError> = {
  [BACKEND_MESSAGES.ACADEMIC.GRADUATION_DATE_ORDER]: 'date_order',
  [BACKEND_MESSAGES.ACADEMIC.WITHDRAWAL_REASON_REQUIRED]: 'withdrawal_reason_required',
  [BACKEND_MESSAGES.ACADEMIC.DUPLICATE_ADVISOR_IDS]: 'duplicate_advisor_ids',
};

export function mapStudentProgramValidationMessage(
  message: string | undefined,
): StudentProgramError | null {
  if (!message) {
    return null;
  }

  return VALIDATION_MESSAGE_MAP[message] ?? null;
}

export const mapStudentProgramError = createDomainErrorMapper<StudentProgramError>({
  rules: [
    {
      match: matchNotFound(BACKEND_MESSAGES.ACADEMIC.STUDENT_PROGRAM_NOT_FOUND),
      key: 'program_not_found',
    },
    {
      match: matchMessage(BACKEND_MESSAGES.ACADEMIC.STUDENT_PROGRAM_NOT_FOUND),
      key: 'program_not_found',
    },
    {
      match: matchMessage(BACKEND_MESSAGES.ACADEMIC.PROFESSOR_NOT_FOUND),
      key: 'professor_not_found',
    },
    { match: matchNotFound(BACKEND_MESSAGES.ACADEMIC.STUDENT_NOT_FOUND), key: 'student_not_found' },
    { match: matchMessage(BACKEND_MESSAGES.ACADEMIC.STUDENT_NOT_FOUND), key: 'student_not_found' },
    { match: matchValidation(BACKEND_MESSAGES.ACADEMIC.GRADUATION_DATE_ORDER), key: 'date_order' },
    {
      match: matchValidation(BACKEND_MESSAGES.ACADEMIC.WITHDRAWAL_REASON_REQUIRED),
      key: 'withdrawal_reason_required',
    },
    {
      match: matchValidation(BACKEND_MESSAGES.ACADEMIC.DUPLICATE_ADVISOR_IDS),
      key: 'duplicate_advisor_ids',
    },
    { match: matchStatus(400), key: 'validation' },
  ],
  fallback: 'server',
});

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
