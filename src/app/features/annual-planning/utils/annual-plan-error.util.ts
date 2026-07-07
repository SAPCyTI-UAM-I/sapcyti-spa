import {
  createDomainErrorMapper,
  matchCode,
  matchStatus,
} from '../../../core/errors/utils/create-domain-error-mapper.util';

export const ANNUAL_PLAN_ERROR_I18N_SCOPE = 'ANNUAL_PLANNING.ERRORS' as const;

export type AnnualPlanError =
  | 'already_exists'
  | 'file_format_invalid'
  | 'not_editable'
  | 'invalid_transition'
  | 'not_found'
  | 'validation'
  | 'server';

/**
 * Maps the API error to a stable domain key. For `file_format_invalid` the wizard
 * shows the backend `message` verbatim (it names the missing section/column), so
 * read it with `getApiErrorMessage` alongside this key.
 */
export const mapAnnualPlanError = createDomainErrorMapper<AnnualPlanError>({
  rules: [
    { match: matchCode('ANNUAL_PLAN_ALREADY_EXISTS'), key: 'already_exists' },
    { match: matchCode('FILE_FORMAT_INVALID'), key: 'file_format_invalid' },
    { match: matchCode('PLAN_NOT_EDITABLE'), key: 'not_editable' },
    { match: matchCode('INVALID_STATUS_TRANSITION'), key: 'invalid_transition' },
    { match: matchStatus(404), key: 'not_found' },
    { match: matchStatus(400), key: 'validation' },
  ],
  fallback: 'server',
  securityFallback: 'server',
});
