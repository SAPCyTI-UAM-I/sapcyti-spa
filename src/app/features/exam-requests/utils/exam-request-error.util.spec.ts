import { mockApiError } from '../../../core/errors/testing/mock-api-error.util';
import { mapExamRequestError } from './exam-request-error.util';

describe('mapExamRequestError', () => {
  it('maps PROGRAM_NOT_ELIGIBLE before the security fallback', () => {
    expect(
      mapExamRequestError(
        mockApiError({
          status: 403,
          error: 'PROGRAM_NOT_ELIGIBLE',
          message: 'Program is not eligible',
        }),
      ),
    ).toBe('program_not_eligible');
  });

  it('keeps FORBIDDEN as a security fallback', () => {
    expect(mapExamRequestError(mockApiError({ status: 403, error: 'FORBIDDEN' }))).toBe(
      'forbidden',
    );
  });

  it('maps academic and validation codes', () => {
    expect(mapExamRequestError(mockApiError({ status: 404, error: 'STUDENT_NOT_FOUND' }))).toBe(
      'student_not_found',
    );
    expect(mapExamRequestError(mockApiError({ status: 400, error: 'VALIDATION_ERROR' }))).toBe(
      'validation',
    );
    expect(
      mapExamRequestError(mockApiError({ status: 409, error: 'ACADEMIC_PROGRAM_AMBIGUOUS' })),
    ).toBe('academic_program');
  });
});
