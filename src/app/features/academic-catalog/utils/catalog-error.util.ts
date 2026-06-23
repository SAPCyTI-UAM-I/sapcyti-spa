import { BACKEND_MESSAGES } from '../../../core/errors/constants/backend-messages';
import {
  createDomainErrorMapper,
  matchCode,
  matchConflict,
  matchNotFound,
  matchStatus,
  matchValidation,
} from '../../../core/errors/utils/create-domain-error-mapper.util';

export const CATALOG_ERROR_I18N_SCOPE = 'ACADEMIC_CATALOG.ERRORS' as const;

export type CatalogError =
  | 'duplicate_email'
  | 'duplicate_enrollment'
  | 'duplicate_employee'
  | 'graduate_program_not_found'
  | 'reference_not_found'
  | 'sabbatical_date_order'
  | 'server';

export const mapCatalogError = createDomainErrorMapper<CatalogError>({
  rules: [
    { match: matchCode('EMAIL_ALREADY_EXISTS'), key: 'duplicate_email' },
    { match: matchCode('ENROLLMENT_ALREADY_EXISTS'), key: 'duplicate_enrollment' },
    { match: matchCode('EMPLOYEE_NUMBER_ALREADY_EXISTS'), key: 'duplicate_employee' },
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
      match: matchNotFound(BACKEND_MESSAGES.ACADEMIC.GRADUATE_PROGRAM_NOT_FOUND),
      key: 'graduate_program_not_found',
    },
    {
      match: matchValidation(BACKEND_MESSAGES.ACADEMIC.SABBATICAL_DATE_ORDER),
      key: 'sabbatical_date_order',
    },
    { match: matchStatus(404), key: 'reference_not_found' },
  ],
  fallback: 'server',
});
