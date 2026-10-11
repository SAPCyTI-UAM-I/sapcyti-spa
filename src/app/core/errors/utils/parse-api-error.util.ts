import { HttpErrorResponse } from '@angular/common/http';

import { ParsedApiError } from '../models/parsed-api-error.model';

/** Cuerpo crudo del API. `details` es opcional para no romper payloads legacy. */
export interface ApiErrorBody {
  code?: string;
  error?: string;
  message?: string;
  details?: unknown;
}

/** Error de campo publicado en `details.fieldErrors` (whitelist HU-62). */
export interface ApiFieldError {
  field: string;
  code: string;
  message: string;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null;
}

/** Estrecha unknown a objeto plano; arrays y null no cuentan. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Extrae `fieldErrors` de `details` sin casts. Si la forma no coincide, lista vacía.
 */
export function extractFieldErrors(details: unknown): ApiFieldError[] {
  if (!isRecord(details) || !Array.isArray(details['fieldErrors'])) {
    return [];
  }

  return details['fieldErrors'].filter((item): item is ApiFieldError => {
    if (!isRecord(item)) {
      return false;
    }

    return (
      typeof item['field'] === 'string' &&
      typeof item['code'] === 'string' &&
      typeof item['message'] === 'string'
    );
  });
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
  const details = getApiErrorDetails(error);

  if (status === undefined && code === undefined && message === undefined) {
    return null;
  }

  // Solo adjunta `details` cuando el cuerpo lo trae; no inventa metadatos.
  return details !== undefined ? { status, code, message, details } : { status, code, message };
}

export function getApiErrorCode(error: unknown): string | undefined {
  const body = parseApiError(error);
  return body?.code ?? body?.error;
}

export function getApiErrorMessage(error: unknown): string | undefined {
  const body = parseApiError(error);
  return body?.message;
}

/** Devuelve `details` tal cual; undefined si el cuerpo no lo declara. */
export function getApiErrorDetails(error: unknown): unknown | undefined {
  const body = parseApiError(error);
  if (!body || !('details' in body)) {
    return undefined;
  }

  return body.details;
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
