import { mockApiError } from '../../../core/errors/testing/mock-api-error.util';
import { mapAnnualPlanError } from './annual-plan-error.util';

describe('mapAnnualPlanError', () => {
  it('maps stable backend codes', () => {
    expect(
      mapAnnualPlanError(mockApiError({ status: 409, error: 'ANNUAL_PLAN_ALREADY_EXISTS' })),
    ).toBe('already_exists');
    expect(mapAnnualPlanError(mockApiError({ status: 400, error: 'FILE_FORMAT_INVALID' }))).toBe(
      'file_format_invalid',
    );
    expect(mapAnnualPlanError(mockApiError({ status: 409, error: 'PLAN_NOT_EDITABLE' }))).toBe(
      'not_editable',
    );
    expect(
      mapAnnualPlanError(mockApiError({ status: 409, error: 'INVALID_STATUS_TRANSITION' })),
    ).toBe('invalid_transition');
  });

  it('falls back by status then to server', () => {
    expect(mapAnnualPlanError(mockApiError({ status: 404 }))).toBe('not_found');
    expect(mapAnnualPlanError(mockApiError({ status: 400 }))).toBe('validation');
    expect(mapAnnualPlanError(new Error('boom'))).toBe('server');
  });
});
