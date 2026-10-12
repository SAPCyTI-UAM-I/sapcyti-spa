import { HttpErrorResponse } from '@angular/common/http';

import { isRecord } from './parse-api-error.util';

/** Tope del contrato: no leer cuerpos de error mayores a 64 KiB. */
const MAX_BLOB_ERROR_BYTES = 64 * 1024;

/**
 * Si un GET blob devolvió JSON de error, reemite un HttpErrorResponse con el
 * cuerpo parseado y la misma metadata HTTP. Cualquier otro caso conserva el error.
 */
export async function normalizeBlobError(error: unknown): Promise<unknown> {
  if (!(error instanceof HttpErrorResponse) || error.status === 0) {
    return error;
  }

  const blob = error.error;
  if (!(blob instanceof Blob) || blob.size > MAX_BLOB_ERROR_BYTES) {
    return error;
  }

  if (!isJsonMime(error.headers.get('Content-Type')) && !isJsonMime(blob.type)) {
    return error;
  }

  try {
    const parsed: unknown = JSON.parse(await blob.text());
    if (!isErrorEnvelope(parsed)) {
      return error;
    }

    return new HttpErrorResponse({
      error: parsed,
      headers: error.headers,
      status: error.status,
      statusText: error.statusText,
      url: error.url ?? undefined,
    });
  } catch {
    return error;
  }
}

function isJsonMime(value: string | null): boolean {
  const mime = value?.split(';')[0]?.trim().toLowerCase();
  return mime === 'application/json';
}

function isErrorEnvelope(value: unknown): value is { error: string } {
  return isRecord(value) && typeof value['error'] === 'string' && value['error'].length > 0;
}
