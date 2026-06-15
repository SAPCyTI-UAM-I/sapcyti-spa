import { HttpErrorResponse } from '@angular/common/http';

import { PageResponse } from '../../../models/page-response.model';

export function page<T>(content: T[], pageIndex: number, size: number): PageResponse<T> {
  const start = pageIndex * size;
  return {
    content: content.slice(start, start + size),
    totalElements: content.length,
    totalPages: Math.ceil(content.length / size),
    size,
    number: pageIndex,
  };
}

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function nextId(items: readonly { id: number }[]): number {
  return Math.max(0, ...items.map((item) => item.id)) + 1;
}

export function generatedPassword(seed: number): string {
  return `Tmp${seed}#Sap26`;
}

export function mockConflict(code: string): HttpErrorResponse {
  return new HttpErrorResponse({ status: 409, error: { error: code } });
}

export function mockNotFound(code: string): HttpErrorResponse {
  return new HttpErrorResponse({ status: 404, error: { error: code } });
}
