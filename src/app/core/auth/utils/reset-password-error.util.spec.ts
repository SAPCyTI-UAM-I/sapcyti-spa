import { mockApiError } from '../../../core/errors/testing/mock-api-error.util';
import { mapResetPasswordError } from './reset-password-error.util';

describe('mapResetPasswordError', () => {
  it('maps expired token from production error field', () => {
    expect(
      mapResetPasswordError(
        mockApiError({
          status: 400,
          error: 'EXPIRED_TOKEN',
          message: 'Reset token has expired',
        }),
      ),
    ).toBe('expired_token');
  });

  it('maps invalid token from production error field', () => {
    expect(
      mapResetPasswordError(
        mockApiError({
          status: 400,
          error: 'INVALID_TOKEN',
          message: 'Reset token is invalid',
        }),
      ),
    ).toBe('invalid_token');
  });

  it('maps used token to invalid_token', () => {
    expect(
      mapResetPasswordError(
        mockApiError({
          status: 400,
          error: 'TOKEN_USED',
          message: 'Reset token was already used',
        }),
      ),
    ).toBe('invalid_token');
  });

  it('still supports legacy mock code field', () => {
    expect(mapResetPasswordError(mockApiError({ status: 400, code: 'EXPIRED_TOKEN' }))).toBe(
      'expired_token',
    );
  });

  it('maps unexpected failures to server error', () => {
    expect(mapResetPasswordError(mockApiError({ status: 500 }))).toBe('server');
  });
});
