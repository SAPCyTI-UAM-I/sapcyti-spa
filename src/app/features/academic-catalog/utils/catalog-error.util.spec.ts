import { BACKEND_MESSAGES } from '../../../core/errors/constants/backend-messages';
import {
  mockApiError,
  mockSpringBootNotFound,
} from '../../../core/errors/testing/mock-api-error.util';
import { mapCatalogError, professorDeactivationConflict } from './catalog-error.util';

describe('mapCatalogError', () => {
  it('maps legacy mock conflict codes', () => {
    expect(mapCatalogError(mockApiError({ status: 409, code: 'EMAIL_ALREADY_EXISTS' }))).toBe(
      'duplicate_email',
    );
  });

  it('maps production CONFLICT responses by message', () => {
    expect(
      mapCatalogError(
        mockApiError({
          status: 409,
          error: 'CONFLICT',
          message: BACKEND_MESSAGES.ACADEMIC.DUPLICATE_STUDENT_EMAIL,
        }),
      ),
    ).toBe('duplicate_email');
  });

  it('maps duplicate enrollment conflicts', () => {
    expect(
      mapCatalogError(
        mockApiError({
          status: 409,
          error: 'CONFLICT',
          message: BACKEND_MESSAGES.ACADEMIC.DUPLICATE_ENROLLMENT,
        }),
      ),
    ).toBe('duplicate_enrollment');
  });

  it('maps duplicate employee conflicts', () => {
    expect(
      mapCatalogError(
        mockApiError({
          status: 409,
          error: 'CONFLICT',
          message: BACKEND_MESSAGES.ACADEMIC.DUPLICATE_EMPLOYEE,
        }),
      ),
    ).toBe('duplicate_employee');
  });

  it('maps graduate program not found by message', () => {
    expect(
      mapCatalogError(
        mockApiError({
          status: 404,
          error: 'NOT_FOUND',
          message: BACKEND_MESSAGES.ACADEMIC.GRADUATE_PROGRAM_NOT_FOUND,
        }),
      ),
    ).toBe('graduate_program_not_found');
  });

  it('maps sabbatical validation errors', () => {
    expect(
      mapCatalogError(
        mockApiError({
          status: 400,
          error: 'VALIDATION_ERROR',
          message: BACKEND_MESSAGES.ACADEMIC.SABBATICAL_DATE_ORDER,
        }),
      ),
    ).toBe('sabbatical_date_order');
  });

  it('maps Spring Boot 404 without message', () => {
    expect(mapCatalogError(mockSpringBootNotFound())).toBe('reference_not_found');
  });

  it('falls back to server for unknown failures', () => {
    expect(mapCatalogError(mockApiError({ status: 500 }))).toBe('server');
  });

  it('maps the professor HU-24/HU-54 codes', () => {
    expect(mapCatalogError(mockApiError({ status: 409, error: 'NEMP_IMMUTABLE' }))).toBe(
      'nemp_immutable',
    );
    expect(mapCatalogError(mockApiError({ status: 409, error: 'INVALID_TYPE_CHANGE' }))).toBe(
      'invalid_type_change',
    );
    expect(mapCatalogError(mockApiError({ status: 409, error: 'PROFESSOR_ALREADY_ACTIVE' }))).toBe(
      'professor_already_active',
    );
    expect(mapCatalogError(mockApiError({ status: 409, error: 'DUPLICATE_EMPLOYEE_NUMBER' }))).toBe(
      'duplicate_employee',
    );
  });

  it('extracts the structured professor deactivation blockers', () => {
    const conflict = professorDeactivationConflict(
      new HttpErrorResponse({
        status: 409,
        error: {
          error: 'PROFESSOR_HAS_ACTIVE_ASSIGNMENTS',
          message: 'blocked',
          hasTutorOrAdvisorAssignments: true,
          openGroupAssignments: [
            { planId: 3, term: '26I', ueaId: 7, clave: '2156027', grupo: 'CO43' },
          ],
        },
      }),
    );

    expect(conflict?.hasTutorOrAdvisorAssignments).toBe(true);
    expect(conflict?.openGroupAssignments[0]?.term).toBe('26I');
  });
});
import { HttpErrorResponse } from '@angular/common/http';
