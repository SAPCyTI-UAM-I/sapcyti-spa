import {
  createDomainErrorMapper,
  matchCode,
} from '../../../core/errors/utils/create-domain-error-mapper.util';
import { getApiErrorCode } from '../../../core/errors/utils/parse-api-error.util';

export const EXAM_REQUEST_ERROR_I18N_SCOPE = 'EXAM_REQUEST.ERRORS' as const;

export type ExamRequestError =
  | 'program_not_eligible'
  | 'student_not_found'
  | 'validation'
  | 'academic_program'
  | 'dependency_unavailable'
  | 'forbidden'
  | 'generic';

const mapExamRequestDomainError = createDomainErrorMapper<ExamRequestError>({
  rules: [
    { match: matchCode('STUDENT_NOT_FOUND'), key: 'student_not_found' },
    { match: matchCode('VALIDATION_ERROR'), key: 'validation' },
    { match: matchCode('ACADEMIC_PROGRAM_AMBIGUOUS'), key: 'academic_program' },
    { match: matchCode('ACADEMIC_PROGRAM_CHANGED'), key: 'academic_program' },
    { match: matchCode('DEGREE_UNSUPPORTED'), key: 'academic_program' },
    { match: matchCode('PROGRAM_STATUS_UNSUPPORTED'), key: 'academic_program' },
    { match: matchCode('STUDENT_DATA_INCOMPLETE'), key: 'academic_program' },
    { match: matchCode('DEPENDENCY_UNAVAILABLE'), key: 'dependency_unavailable' },
  ],
  fallback: 'generic',
  securityFallback: 'forbidden',
});

/**
 * PROGRAM_NOT_ELIGIBLE es 403 de negocio: se resuelve antes del mapper
 * para no tratarlo como error de seguridad.
 */
export function mapExamRequestError(error: unknown): ExamRequestError {
  if (getApiErrorCode(error) === 'PROGRAM_NOT_ELIGIBLE') {
    return 'program_not_eligible';
  }

  return mapExamRequestDomainError(error);
}
