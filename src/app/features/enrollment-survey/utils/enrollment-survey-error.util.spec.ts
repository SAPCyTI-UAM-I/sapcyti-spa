import { HttpErrorResponse } from '@angular/common/http';

import { mapEnrollmentSurveyError } from './enrollment-survey-error.util';

const apiError = (status: number, error: string): HttpErrorResponse =>
  new HttpErrorResponse({ status, error: { error } });

describe('mapEnrollmentSurveyError', () => {
  it('maps each stable error code to its key', () => {
    expect(mapEnrollmentSurveyError(apiError(409, 'SURVEY_ALREADY_EXISTS_FOR_TERM'))).toBe(
      'survey_already_exists_for_term',
    );
    expect(mapEnrollmentSurveyError(apiError(409, 'SURVEY_NOT_DELETABLE'))).toBe(
      'survey_not_deletable',
    );
    expect(mapEnrollmentSurveyError(apiError(409, 'SURVEY_NOT_ACTIVE'))).toBe('survey_not_active');
    expect(mapEnrollmentSurveyError(apiError(404, 'SURVEY_NOT_FOUND'))).toBe('survey_not_found');
    expect(mapEnrollmentSurveyError(apiError(409, 'UEA_NOT_AVAILABLE'))).toBe('uea_not_available');
    expect(mapEnrollmentSurveyError(apiError(400, 'BLANK_WITH_UEAS_CONFLICT'))).toBe(
      'blank_with_ueas_conflict',
    );
    expect(mapEnrollmentSurveyError(apiError(400, 'VALIDATION_ERROR'))).toBe('validation');
  });

  it('falls back to server for unknown errors', () => {
    expect(mapEnrollmentSurveyError(apiError(500, 'BOOM'))).toBe('server');
    expect(mapEnrollmentSurveyError(new Error('offline'))).toBe('server');
  });

  it('hides 401/403 behind the security fallback', () => {
    expect(mapEnrollmentSurveyError(apiError(403, 'FORBIDDEN'))).toBe('server');
  });
});
