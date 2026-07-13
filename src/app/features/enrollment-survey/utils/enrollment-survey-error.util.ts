import {
  createDomainErrorMapper,
  matchCode,
} from '../../../core/errors/utils/create-domain-error-mapper.util';

export const ENROLLMENT_SURVEY_ERROR_I18N_SCOPE = 'ENROLLMENT_SURVEY.ERRORS' as const;

export type EnrollmentSurveyError =
  | 'survey_already_exists_for_term'
  | 'survey_window_overlaps'
  | 'survey_no_active_ueas'
  | 'survey_reopen_dates_invalid'
  | 'survey_not_deletable'
  | 'survey_not_active'
  | 'survey_not_found'
  | 'uea_not_available'
  | 'blank_with_ueas_conflict'
  | 'validation'
  | 'server';

export const mapEnrollmentSurveyError = createDomainErrorMapper<EnrollmentSurveyError>({
  rules: [
    { match: matchCode('SURVEY_ALREADY_EXISTS_FOR_TERM'), key: 'survey_already_exists_for_term' },
    { match: matchCode('SURVEY_WINDOW_OVERLAPS'), key: 'survey_window_overlaps' },
    { match: matchCode('SURVEY_NO_ACTIVE_UEAS'), key: 'survey_no_active_ueas' },
    { match: matchCode('SURVEY_REOPEN_DATES_INVALID'), key: 'survey_reopen_dates_invalid' },
    { match: matchCode('SURVEY_NOT_DELETABLE'), key: 'survey_not_deletable' },
    { match: matchCode('SURVEY_NOT_ACTIVE'), key: 'survey_not_active' },
    { match: matchCode('SURVEY_NOT_FOUND'), key: 'survey_not_found' },
    { match: matchCode('UEA_NOT_AVAILABLE'), key: 'uea_not_available' },
    { match: matchCode('BLANK_WITH_UEAS_CONFLICT'), key: 'blank_with_ueas_conflict' },
    { match: matchCode('VALIDATION_ERROR'), key: 'validation' },
  ],
  fallback: 'server',
  securityFallback: 'server',
});
