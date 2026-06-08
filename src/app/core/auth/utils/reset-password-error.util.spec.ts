import { HttpErrorResponse } from '@angular/common/http';

import { mapResetPasswordError } from './reset-password-error.util';

describe('mapResetPasswordError', () => {
  it('maps expired token', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { code: 'EXPIRED_TOKEN' },
    });

    expect(mapResetPasswordError(error)).toBe('expired_token');
  });

  it('maps invalid token from code field', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { code: 'INVALID_TOKEN' },
    });

    expect(mapResetPasswordError(error)).toBe('invalid_token');
  });

  it('maps invalid token from error field', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { error: 'TOKEN_USED' },
    });

    expect(mapResetPasswordError(error)).toBe('invalid_token');
  });

  it('maps unexpected failures to server error', () => {
    const error = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });

    expect(mapResetPasswordError(error)).toBe('server');
  });
});
