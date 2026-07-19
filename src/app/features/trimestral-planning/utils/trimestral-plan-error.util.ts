import {
  createDomainErrorMapper,
  matchCode,
  matchStatus,
} from '../../../core/errors/utils/create-domain-error-mapper.util';

export const TRIMESTRAL_PLAN_ERROR_I18N_SCOPE = 'TRIMESTRAL_PLANNING.ERRORS' as const;

export type TrimestralPlanError =
  | 'already_exists'
  | 'annual_plan_required'
  | 'survey_not_closed'
  | 'survey_not_found'
  | 'not_editable'
  | 'invalid_transition'
  | 'not_found'
  | 'validation'
  | 'server';

export const mapTrimestralPlanError = createDomainErrorMapper<TrimestralPlanError>({
  rules: [
    { match: matchCode('TRIMESTRAL_PLAN_ALREADY_EXISTS'), key: 'already_exists' },
    { match: matchCode('ANNUAL_PLAN_REQUIRED'), key: 'annual_plan_required' },
    { match: matchCode('SURVEY_NOT_CLOSED'), key: 'survey_not_closed' },
    { match: matchCode('SURVEY_NOT_FOUND'), key: 'survey_not_found' },
    { match: matchCode('TRIMESTRAL_PLAN_NOT_EDITABLE'), key: 'not_editable' },
    { match: matchCode('INVALID_STATUS_TRANSITION'), key: 'invalid_transition' },
    { match: matchStatus(404), key: 'not_found' },
    { match: matchStatus(400), key: 'validation' },
  ],
  fallback: 'server',
  securityFallback: 'server',
});
