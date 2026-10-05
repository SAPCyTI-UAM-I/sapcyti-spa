import { HttpErrorResponse } from '@angular/common/http';

import { mockSpringBootNotFound } from '../testing/mock-api-error.util';
import {
  getApiErrorCode,
  getApiErrorMessage,
  getHttpStatus,
  parseApiError,
} from './parse-api-error.util';

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
    expect(getApiErrorMessage(error)).toBe('Token is invalid');
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
    expect(getApiErrorMessage(error)).toBeUndefined();
    expect(getHttpStatus(error)).toBe(404);
  });

  it('returns null for non-object payloads', () => {
    const error = new HttpErrorResponse({ status: 500, error: 'Internal Server Error' });

    expect(parseApiError(error)).toBeNull();
    expect(getApiErrorCode(error)).toBeUndefined();
  });

  it('parses Spring Boot default 404 without message', () => {
    const error = mockSpringBootNotFound('/api/students/1/programs');

    expect(parseApiError(error)).toEqual({
      error: 'Not Found',
      status: 404,
      timestamp: '2026-01-01T00:00:00.000+00:00',
      path: '/api/students/1/programs',
    });
    expect(getApiErrorCode(error)).toBe('Not Found');
    expect(getApiErrorMessage(error)).toBeUndefined();
    expect(getHttpStatus(error)).toBe(404);
  });
});
