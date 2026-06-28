import { HttpErrorResponse } from '@angular/common/http';

export interface MockApiErrorOptions {
  status: number;
  error?: string;
  message?: string;
  /** Legacy mock field; mapped to `error` when `error` is omitted. */
  code?: string;
}

/** Builds an HttpErrorResponse matching sapcyti-api ErrorResponse { error, message }. */
export function mockApiError(options: MockApiErrorOptions): HttpErrorResponse {
  const errorCode = options.error ?? options.code;
  const body =
    errorCode || options.message
      ? {
          ...(errorCode ? { error: errorCode } : {}),
          ...(options.message ? { message: options.message } : {}),
        }
      : null;

  return new HttpErrorResponse({
    status: options.status,
    error: body,
  });
}

/** Spring Boot default 404 payload (no `message` field). */
export function mockSpringBootNotFound(path = '/api/unknown'): HttpErrorResponse {
  return new HttpErrorResponse({
    status: 404,
    error: {
      timestamp: '2026-01-01T00:00:00.000+00:00',
      status: 404,
      error: 'Not Found',
      path,
    },
  });
}
