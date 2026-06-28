import { BACKEND_MESSAGES } from '../../../core/errors/constants/backend-messages';
import {
  createDomainErrorMapper,
  matchCode,
  matchConflict,
  matchNotFound,
  matchSpringBootNotFound,
  matchStatus,
  matchValidation,
} from '../../../core/errors/utils/create-domain-error-mapper.util';

export const CATALOG_ERROR_I18N_SCOPE = 'ACADEMIC_CATALOG.ERRORS' as const;

export type CatalogError =
  | 'duplicate_email'
  | 'duplicate_enrollment'
  | 'duplicate_employee'
  | 'duplicate_advisor_ids'
  | 'graduate_program_not_found'
  | 'reference_not_found'
  | 'professor_not_found'
  | 'professor_already_inactive'
  | 'professor_has_active_assignments'
  | 'employee_required_for_interno'
  | 'sabbatical_date_order'
  | 'validation'
  | 'server';

export const mapCatalogError = createDomainErrorMapper<CatalogError>({
  rules: [
    { match: matchCode('EMAIL_ALREADY_EXISTS'), key: 'duplicate_email' },
    { match: matchCode('ENROLLMENT_ALREADY_EXISTS'), key: 'duplicate_enrollment' },
    { match: matchCode('EMPLOYEE_NUMBER_ALREADY_EXISTS'), key: 'duplicate_employee' },
    { match: matchCode('PROFESSOR_ALREADY_INACTIVE'), key: 'professor_already_inactive' },
    {
      match: matchCode('PROFESSOR_HAS_ACTIVE_ASSIGNMENTS'),
      key: 'professor_has_active_assignments',
    },
    {
      match: matchCode('EMPLOYEE_REQUIRED_FOR_INTERNO'),
      key: 'employee_required_for_interno',
    },
    {
      match: matchConflict(BACKEND_MESSAGES.ACADEMIC.DUPLICATE_STUDENT_EMAIL),
      key: 'duplicate_email',
    },
    {
      match: matchConflict(BACKEND_MESSAGES.ACADEMIC.DUPLICATE_ENROLLMENT),
      key: 'duplicate_enrollment',
    },
    {
      match: matchConflict(BACKEND_MESSAGES.ACADEMIC.DUPLICATE_EMPLOYEE),
      key: 'duplicate_employee',
    },
    {
      match: matchConflict(BACKEND_MESSAGES.ACADEMIC.PROFESSOR_ALREADY_INACTIVE),
      key: 'professor_already_inactive',
    },
    {
      match: matchConflict(BACKEND_MESSAGES.ACADEMIC.PROFESSOR_HAS_ACTIVE_ASSIGNMENTS),
      key: 'professor_has_active_assignments',
    },
    {
      match: matchNotFound(BACKEND_MESSAGES.ACADEMIC.GRADUATE_PROGRAM_NOT_FOUND),
      key: 'graduate_program_not_found',
    },
    {
      match: matchNotFound(BACKEND_MESSAGES.ACADEMIC.PROFESSOR_NOT_FOUND),
      key: 'professor_not_found',
    },
    {
      match: matchValidation(BACKEND_MESSAGES.ACADEMIC.EMPLOYEE_REQUIRED_FOR_INTERNO),
      key: 'employee_required_for_interno',
    },
    {
      match: matchValidation(BACKEND_MESSAGES.ACADEMIC.SABBATICAL_DATE_ORDER),
      key: 'sabbatical_date_order',
    },
    {
      match: matchValidation(BACKEND_MESSAGES.ACADEMIC.DUPLICATE_ADVISOR_IDS),
      key: 'duplicate_advisor_ids',
    },
    { match: matchSpringBootNotFound, key: 'reference_not_found' },
    { match: matchStatus(404), key: 'reference_not_found' },
    { match: matchStatus(400), key: 'validation' },
  ],
  fallback: 'server',
  securityFallback: 'server',
});

export function mapProfessorError(error: unknown): CatalogError {
  const mapped = mapCatalogError(error);
  if (mapped === 'reference_not_found') {
    return 'professor_not_found';
  }
  return mapped;
}
