import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import { normalizeBlobError } from './normalize-blob-error.util';

function jsonBlob(body: string, type = 'application/json'): Blob {
  return new Blob([body], { type });
}

function blobError(options: {
  status: number;
  statusText?: string;
  url?: string;
  headers?: Record<string, string>;
  body: Blob;
}): HttpErrorResponse {
  return new HttpErrorResponse({
    status: options.status,
    statusText: options.statusText ?? 'Error',
    url: options.url,
    headers: new HttpHeaders(options.headers),
    error: options.body,
  });
}

describe('normalizeBlobError', () => {
  it('parses a JSON blob and keeps status, statusText, headers and url', async () => {
    const original = blobError({
      status: 404,
      statusText: 'Not Found',
      url: '/api/exam-requests/me/GRADO/documents/TESIS/content',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Retry-After': '8',
      },
      body: jsonBlob(
        JSON.stringify({ error: 'DOCUMENT_NOT_FOUND', message: 'Document not found' }),
        'application/json; charset=utf-8',
      ),
    });

    const normalized = await normalizeBlobError(original);

    expect(normalized).toBeInstanceOf(HttpErrorResponse);
    const httpError = normalized as HttpErrorResponse;
    expect(httpError).not.toBe(original);
    expect(httpError.status).toBe(404);
    expect(httpError.statusText).toBe('Not Found');
    expect(httpError.url).toBe('/api/exam-requests/me/GRADO/documents/TESIS/content');
    expect(httpError.headers.get('Retry-After')).toBe('8');
    expect(httpError.error).toEqual({
      error: 'DOCUMENT_NOT_FOUND',
      message: 'Document not found',
    });
  });

  it('parses 409 and 503 envelopes when the blob type is JSON even without a header', async () => {
    const conflict = await normalizeBlobError(
      blobError({
        status: 409,
        statusText: 'Conflict',
        body: jsonBlob(
          JSON.stringify({
            error: 'DOCUMENT_IS_EXTERNAL_URL',
            message: 'Article is a URL',
          }),
        ),
      }),
    );
    const unavailable = await normalizeBlobError(
      blobError({
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
        body: new Blob(
          [JSON.stringify({ error: 'DOCUMENT_STORAGE_UNAVAILABLE', message: 'Storage down' })],
          { type: '' },
        ),
      }),
    );

    expect((conflict as HttpErrorResponse).error).toEqual({
      error: 'DOCUMENT_IS_EXTERNAL_URL',
      message: 'Article is a URL',
    });
    expect((unavailable as HttpErrorResponse).status).toBe(503);
    expect((unavailable as HttpErrorResponse).error).toMatchObject({
      error: 'DOCUMENT_STORAGE_UNAVAILABLE',
    });
  });

  it('keeps the original error for status 0, HTML, corrupt JSON, a huge blob and a failed read', async () => {
    const offline = new HttpErrorResponse({
      status: 0,
      error: jsonBlob(JSON.stringify({ error: 'GENERIC_ERROR' })),
    });
    const html = blobError({
      status: 502,
      headers: { 'Content-Type': 'text/html' },
      body: new Blob(['<html>proxy</html>'], { type: 'text/html' }),
    });
    const corrupt = blobError({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: jsonBlob('{'),
    });
    const unexpected = blobError({
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: jsonBlob(JSON.stringify({ message: 'no code' })),
    });
    const huge = blobError({
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: new Blob([new Uint8Array(64 * 1024 + 1)], { type: 'application/json' }),
    });
    const broken = new Blob([JSON.stringify({ error: 'DOCUMENT_NOT_FOUND' })], {
      type: 'application/json',
    });
    Object.defineProperty(broken, 'text', {
      value: () => Promise.reject(new Error('read failed')),
    });
    const unreadable = blobError({
      status: 404,
      headers: { 'Content-Type': 'application/json' },
      body: broken,
    });

    await expect(normalizeBlobError(offline)).resolves.toBe(offline);
    await expect(normalizeBlobError(html)).resolves.toBe(html);
    await expect(normalizeBlobError(corrupt)).resolves.toBe(corrupt);
    await expect(normalizeBlobError(unexpected)).resolves.toBe(unexpected);
    await expect(normalizeBlobError(huge)).resolves.toBe(huge);
    await expect(normalizeBlobError(unreadable)).resolves.toBe(unreadable);
    const notHttp = new Error('not http');
    await expect(normalizeBlobError(notHttp)).resolves.toBe(notHttp);
  });
});
