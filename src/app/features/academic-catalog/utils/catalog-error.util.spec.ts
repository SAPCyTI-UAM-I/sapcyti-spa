import { HttpErrorResponse } from '@angular/common/http';

import { BACKEND_MESSAGES } from '../../../core/errors/constants/backend-messages';
import { mapCatalogError } from './catalog-error.util';

describe('mapCatalogError', () => {
  it('maps legacy mock conflict codes', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { error: 'EMAIL_ALREADY_EXISTS' },
    });

    expect(mapCatalogError(error)).toBe('duplicate_email');
  });

  it('maps production CONFLICT responses by message', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: {
        error: 'CONFLICT',
        message: BACKEND_MESSAGES.ACADEMIC.DUPLICATE_STUDENT_EMAIL,
      },
    });

    expect(mapCatalogError(error)).toBe('duplicate_email');
  });

  it('maps duplicate enrollment conflicts', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: {
        error: 'CONFLICT',
        message: BACKEND_MESSAGES.ACADEMIC.DUPLICATE_ENROLLMENT,
      },
    });

    expect(mapCatalogError(error)).toBe('duplicate_enrollment');
  });

  it('maps graduate program not found by message', () => {
    const error = new HttpErrorResponse({
      status: 404,
      error: {
        error: 'NOT_FOUND',
        message: BACKEND_MESSAGES.ACADEMIC.GRADUATE_PROGRAM_NOT_FOUND,
      },
    });

    expect(mapCatalogError(error)).toBe('graduate_program_not_found');
  });

  it('maps sabbatical validation errors', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        error: 'VALIDATION_ERROR',
        message: BACKEND_MESSAGES.ACADEMIC.SABBATICAL_DATE_ORDER,
      },
    });

    expect(mapCatalogError(error)).toBe('sabbatical_date_order');
  });

  it('falls back to server for unknown failures', () => {
    const error = new HttpErrorResponse({ status: 500 });

    expect(mapCatalogError(error)).toBe('server');
  });
});
