import { HttpErrorResponse } from '@angular/common/http';

import { ParsedApiError } from '../models/parsed-api-error.model';

export interface ApiErrorBody {
  code?: string;
  error?: string;
  message?: string;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null;
}

export function parseApiError(error: unknown): ApiErrorBody | null {
  if (error instanceof HttpErrorResponse) {
    return isApiErrorBody(error.error) ? error.error : null;
  }

  if (typeof error === 'object' && error !== null && 'error' in error) {
    const body = (error as { error?: unknown }).error;
    return isApiErrorBody(body) ? body : null;
  }

  return null;
}

export function toParsedApiError(error: unknown): ParsedApiError | null {
  const status = getHttpStatus(error);
  const code = getApiErrorCode(error);
  const message = getApiErrorMessage(error);

  if (status === undefined && code === undefined && message === undefined) {
    return null;
  }

  return { status, code, message };
}

export function getApiErrorCode(error: unknown): string | undefined {
  const body = parseApiError(error);
  return body?.code ?? body?.error;
}

export function getApiErrorMessage(error: unknown): string | undefined {
  const body = parseApiError(error);
  return body?.message;
}

export function getHttpStatus(error: unknown): number | undefined {
  if (error instanceof HttpErrorResponse) {
    return error.status;
  }

  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }

  return undefined;
}
