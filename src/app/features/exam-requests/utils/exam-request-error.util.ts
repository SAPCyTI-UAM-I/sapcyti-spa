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

/** Claves de escritura; 200 mixto no entra aquí. */
export type ExamRequestWriteError =
  | 'program_not_eligible'
  | 'student_not_found'
  | 'save_validation'
  | 'academic_program'
  | 'request_not_draft'
  | 'document_not_found'
  | 'version_conflict'
  | 'REQUEST_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'STORAGE_WRITE_FAILED'
  | 'STORAGE_UNAVAILABLE'
  | 'UNSAFE_FILE_NAME'
  | 'EXAM_TYPE_NOT_ALLOWED'
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

const mapExamRequestWriteDomainError = createDomainErrorMapper<ExamRequestWriteError>({
  rules: [
    { match: matchCode('STUDENT_NOT_FOUND'), key: 'student_not_found' },
    { match: matchCode('VALIDATION_ERROR'), key: 'save_validation' },
    { match: matchCode('REQUEST_NOT_DRAFT'), key: 'request_not_draft' },
    { match: matchCode('DOCUMENT_NOT_FOUND'), key: 'document_not_found' },
    { match: matchCode('REQUEST_NOT_FOUND'), key: 'document_not_found' },
    { match: matchCode('VERSION_CONFLICT'), key: 'version_conflict' },
    { match: matchCode('REQUEST_TOO_LARGE'), key: 'REQUEST_TOO_LARGE' },
    { match: matchCode('UNSUPPORTED_MEDIA_TYPE'), key: 'UNSUPPORTED_MEDIA_TYPE' },
    { match: matchCode('STORAGE_WRITE_FAILED'), key: 'STORAGE_WRITE_FAILED' },
    { match: matchCode('STORAGE_UNAVAILABLE'), key: 'STORAGE_UNAVAILABLE' },
    { match: matchCode('UNSAFE_FILE_NAME'), key: 'UNSAFE_FILE_NAME' },
    { match: matchCode('EXAM_TYPE_NOT_ALLOWED'), key: 'EXAM_TYPE_NOT_ALLOWED' },
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
 * Mapper de escrituras HU-65. PROGRAM_NOT_ELIGIBLE sigue fuera del fallback
 * de seguridad. Un 200 con results mixtos no debe llegar a esta función.
 */
export function mapExamRequestWriteError(error: unknown): ExamRequestWriteError {
  if (getApiErrorCode(error) === 'PROGRAM_NOT_ELIGIBLE') {
    return 'program_not_eligible';
  }

  return mapExamRequestWriteDomainError(error);
}
