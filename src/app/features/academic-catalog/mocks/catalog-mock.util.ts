import { HttpErrorResponse } from '@angular/common/http';

import { BACKEND_MESSAGES } from '../../../core/errors/constants/backend-messages';
import { PageResponse } from '../../../models';

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

const LEGACY_CONFLICT_MESSAGES: Record<string, string> = {
  EMAIL_ALREADY_EXISTS: BACKEND_MESSAGES.ACADEMIC.DUPLICATE_STUDENT_EMAIL,
  ENROLLMENT_ALREADY_EXISTS: BACKEND_MESSAGES.ACADEMIC.DUPLICATE_ENROLLMENT,
  EMPLOYEE_NUMBER_ALREADY_EXISTS: BACKEND_MESSAGES.ACADEMIC.DUPLICATE_EMPLOYEE,
};

export function mockBadRequest(message: string): HttpErrorResponse {
  return new HttpErrorResponse({
    status: 400,
    error: { error: 'VALIDATION_ERROR', message },
  });
}

export function mockConflict(code: string): HttpErrorResponse {
  const message = LEGACY_CONFLICT_MESSAGES[code];

  return new HttpErrorResponse({
    status: 409,
    error: message ? { error: 'CONFLICT', message } : { error: code },
  });
}

export function mockNotFound(codeOrMessage: string): HttpErrorResponse {
  const knownMessages: Record<string, string> = {
    GRADUATE_PROGRAM_NOT_FOUND: BACKEND_MESSAGES.ACADEMIC.GRADUATE_PROGRAM_NOT_FOUND,
    USER_NOT_FOUND: BACKEND_MESSAGES.IDENTITY.USER_NOT_FOUND,
  };

  const message = knownMessages[codeOrMessage];
  if (message) {
    return new HttpErrorResponse({
      status: 404,
      error: { error: 'NOT_FOUND', message },
    });
  }

  return new HttpErrorResponse({
    status: 404,
    error: { error: codeOrMessage },
  });
}
