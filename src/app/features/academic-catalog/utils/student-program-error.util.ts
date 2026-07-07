import { FormGroup } from '@angular/forms';

import { BACKEND_MESSAGES } from '../../../core/errors/constants/backend-messages';
import {
  createDomainErrorMapper,
  matchNotFoundOrMessage,
  matchSpringBootNotFound,
  matchStatus,
  matchValidation,
} from '../../../core/errors/utils/create-domain-error-mapper.util';
import { CATALOG_ERROR_I18N_SCOPE } from './catalog-error.util';

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

export const mapStudentProgramError = createDomainErrorMapper<StudentProgramError>({
  rules: [
    {
      match: matchNotFoundOrMessage(BACKEND_MESSAGES.ACADEMIC.STUDENT_PROGRAM_NOT_FOUND),
      key: 'program_not_found',
    },
    {
      match: matchNotFoundOrMessage(BACKEND_MESSAGES.ACADEMIC.PROFESSOR_NOT_FOUND),
      key: 'professor_not_found',
    },
    {
      match: matchNotFoundOrMessage(BACKEND_MESSAGES.ACADEMIC.STUDENT_NOT_FOUND),
      key: 'student_not_found',
    },
    { match: matchValidation(BACKEND_MESSAGES.ACADEMIC.GRADUATION_DATE_ORDER), key: 'date_order' },
    {
      match: matchValidation(BACKEND_MESSAGES.ACADEMIC.WITHDRAWAL_REASON_REQUIRED),
      key: 'withdrawal_reason_required',
    },
    {
      match: matchValidation(BACKEND_MESSAGES.ACADEMIC.DUPLICATE_ADVISOR_IDS),
      key: 'duplicate_advisor_ids',
    },
    { match: matchSpringBootNotFound, key: 'load_failed' },
    { match: matchStatus(400), key: 'validation' },
    { match: matchStatus(404), key: 'load_failed' },
  ],
  fallback: 'server',
  securityFallback: 'server',
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

/** Toast copy when opening programs from the student list. */
export function mapStudentProgramListError(error: unknown): StudentProgramError {
  const mapped = mapStudentProgramError(error);
  return mapped === 'program_not_found' ? 'no_program' : 'load_failed';
}

/** Error keys that belong to the program scope in the student edit screen. */
const STUDENT_EDIT_PROGRAM_SCOPED_KEYS: ReadonlySet<string> = new Set([
  'date_order',
  'withdrawal_reason_required',
  'duplicate_advisor_ids',
  'validation',
  'program_not_found',
  'professor_not_found',
  'student_not_found',
]);

/**
 * i18n key for a student-edit error message. That screen merges two error domains
 * (student + program), so it picks the program scope for program-originated keys
 * and the catalog scope otherwise.
 */
export function studentEditErrorI18nKey(key: string): string {
  const scope = STUDENT_EDIT_PROGRAM_SCOPED_KEYS.has(key)
    ? STUDENT_PROGRAM_ERROR_I18N_SCOPE
    : CATALOG_ERROR_I18N_SCOPE;
  return `${scope}.${key}`;
}
