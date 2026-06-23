import { HttpErrorResponse } from '@angular/common/http';

import { getApiErrorCode, getHttpStatus, parseApiError } from './parse-api-error.util';

describe('parseApiError', () => {
  it('extracts body from HttpErrorResponse', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { code: 'INVALID_TOKEN', message: 'Token is invalid' },
    });

    expect(parseApiError(error)).toEqual({
      code: 'INVALID_TOKEN',
      message: 'Token is invalid',
    });
    expect(getApiErrorCode(error)).toBe('INVALID_TOKEN');
    expect(getHttpStatus(error)).toBe(400);
  });

  it('reads error field when code is absent', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { error: 'TOKEN_USED' },
    });

    expect(getApiErrorCode(error)).toBe('TOKEN_USED');
  });

  it('supports plain error-like objects used in component handlers', () => {
    const error = { status: 404, error: { code: 'NOT_FOUND' } };

    expect(parseApiError(error)).toEqual({ code: 'NOT_FOUND' });
    expect(getHttpStatus(error)).toBe(404);
  });

  it('returns null for non-object payloads', () => {
    const error = new HttpErrorResponse({ status: 500, error: 'Internal Server Error' });

    expect(parseApiError(error)).toBeNull();
    expect(getApiErrorCode(error)).toBeUndefined();
  });
});
