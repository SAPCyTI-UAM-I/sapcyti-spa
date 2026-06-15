import { getApiErrorCode, getHttpStatus } from '../../../core/http/utils/parse-api-error.util';

export type CatalogError =
  | 'duplicate_email'
  | 'duplicate_enrollment'
  | 'duplicate_employee'
  | 'reference_not_found'
  | 'server';

export function mapCatalogError(error: unknown): CatalogError {
  const code = getApiErrorCode(error);
  if (code === 'EMAIL_ALREADY_EXISTS') return 'duplicate_email';
  if (code === 'ENROLLMENT_ALREADY_EXISTS') return 'duplicate_enrollment';
  if (code === 'EMPLOYEE_NUMBER_ALREADY_EXISTS') return 'duplicate_employee';
  if (getHttpStatus(error) === 404) return 'reference_not_found';
  return 'server';
}
