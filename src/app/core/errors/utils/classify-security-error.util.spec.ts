import { mockApiError } from '../testing/mock-api-error.util';
import { isSecurityError } from './classify-security-error.util';

describe('isSecurityError', () => {
  it('detects unauthorized and forbidden statuses', () => {
    expect(isSecurityError(mockApiError({ status: 401, error: 'UNAUTHORIZED' }))).toBe(true);
    expect(isSecurityError(mockApiError({ status: 403, error: 'FORBIDDEN' }))).toBe(true);
  });

  it('detects security error codes regardless of status', () => {
    expect(isSecurityError(mockApiError({ status: 400, error: 'UNAUTHORIZED' }))).toBe(true);
  });

  it('ignores business validation errors', () => {
    expect(
      isSecurityError(
        mockApiError({
          status: 400,
          error: 'VALIDATION_ERROR',
          message: 'Graduation date must be on or after admission date',
        }),
      ),
    ).toBe(false);
  });
});
