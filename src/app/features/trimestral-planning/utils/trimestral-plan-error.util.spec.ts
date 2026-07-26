import { mockApiError } from '../../../core/errors/testing/mock-api-error.util';
import { mapTrimestralPlanError } from './trimestral-plan-error.util';

describe('mapTrimestralPlanError', () => {
  it('maps the stable API codes to domain keys', () => {
    const cases = [
      ['TRIMESTRAL_PLAN_ALREADY_EXISTS', 409, 'already_exists'],
      ['ANNUAL_PLAN_REQUIRED', 409, 'annual_plan_required'],
      ['ANNUAL_PLAN_NOT_TERMINATED', 409, 'annual_plan_not_terminated'],
      ['SURVEY_NOT_CLOSED', 409, 'survey_not_closed'],
      ['SURVEY_NOT_FOUND', 404, 'survey_not_found'],
      ['TRIMESTRAL_PLAN_NOT_EDITABLE', 409, 'not_editable'],
      ['INVALID_STATUS_TRANSITION', 409, 'invalid_transition'],
    ] as const;

    for (const [code, status, key] of cases) {
      expect(mapTrimestralPlanError(mockApiError({ status, error: code }))).toBe(key);
    }
  });

  it('falls back to status-based keys', () => {
    expect(mapTrimestralPlanError(mockApiError({ status: 404, error: 'WHATEVER' }))).toBe(
      'not_found',
    );
    expect(mapTrimestralPlanError(mockApiError({ status: 400, error: 'VALIDATION_ERROR' }))).toBe(
      'validation',
    );
  });

  it('falls back to server for unknown failures', () => {
    expect(mapTrimestralPlanError(new Error('boom'))).toBe('server');
    expect(mapTrimestralPlanError(mockApiError({ status: 403 }))).toBe('server');
  });
});
