import { HttpErrorResponse } from '@angular/common/http';

import { mockApiError, mockSpringBootNotFound } from '../testing/mock-api-error.util';
import {
  extractFieldErrors,
  getApiErrorCode,
  getApiErrorDetails,
  getApiErrorMessage,
  getHttpStatus,
  isRecord,
  parseApiError,
  toParsedApiError,
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

describe('toParsedApiError', () => {
  it('copies details when the body declares them', () => {
    const details = {
      fieldErrors: [
        { field: 'examType', code: 'INVALID_ENUM', message: 'Use GRADO or PREDOCTORAL' },
      ],
    };
    const error = mockApiError({
      status: 400,
      error: 'VALIDATION_ERROR',
      message: 'Invalid exam type',
      details,
    });

    expect(toParsedApiError(error)).toEqual({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid exam type',
      details,
    });
    expect(getApiErrorDetails(error)).toEqual(details);
  });

  it('omits details when the body does not declare them', () => {
    const error = mockApiError({
      status: 400,
      error: 'VALIDATION_ERROR',
      message: 'Invalid exam type',
    });

    expect(toParsedApiError(error)).toEqual({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid exam type',
    });
    expect(getApiErrorDetails(error)).toBeUndefined();
  });

  it('propagates malformed details without inventing a structure', () => {
    const error = mockApiError({
      status: 409,
      error: 'VERSION_CONFLICT',
      message: 'The resource version changed',
      details: 'not-an-object',
    });

    expect(toParsedApiError(error)).toEqual({
      status: 409,
      code: 'VERSION_CONFLICT',
      message: 'The resource version changed',
      details: 'not-an-object',
    });
    expect(extractFieldErrors(getApiErrorDetails(error))).toEqual([]);
  });
});

describe('isRecord', () => {
  it('accepts plain objects and rejects arrays, null and primitives', () => {
    expect(isRecord({ field: 'examType' })).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord('details')).toBe(false);
  });
});

describe('extractFieldErrors', () => {
  it('returns valid field errors and drops malformed entries', () => {
    const details = {
      fieldErrors: [
        { field: 'examType', code: 'INVALID_ENUM', message: 'Use GRADO or PREDOCTORAL' },
        { field: 'body', code: 'INVALID_TYPE' },
        null,
        'skip',
      ],
    };

    expect(extractFieldErrors(details)).toEqual([
      { field: 'examType', code: 'INVALID_ENUM', message: 'Use GRADO or PREDOCTORAL' },
    ]);
  });

  it('returns an empty list when details is absent or malformed', () => {
    expect(extractFieldErrors(undefined)).toEqual([]);
    expect(extractFieldErrors(null)).toEqual([]);
    expect(extractFieldErrors({ fieldErrors: 'not-an-array' })).toEqual([]);
    expect(extractFieldErrors({ missing: true })).toEqual([]);
  });
});
