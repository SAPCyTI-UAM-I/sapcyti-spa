import { mockApiError } from '../../../core/errors/testing/mock-api-error.util';
import {
  mapExamRequestError,
  mapExamRequestWriteError,
  mapSaveDocumentItemError,
} from './exam-request-error.util';

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

describe('mapExamRequestWriteError', () => {
  it('maps PROGRAM_NOT_ELIGIBLE before the security fallback', () => {
    expect(
      mapExamRequestWriteError(
        mockApiError({
          status: 403,
          error: 'PROGRAM_NOT_ELIGIBLE',
          message: 'Program is not eligible',
        }),
      ),
    ).toBe('program_not_eligible');
  });

  it('maps write codes without using the read validation key', () => {
    expect(mapExamRequestWriteError(mockApiError({ status: 400, error: 'VALIDATION_ERROR' }))).toBe(
      'save_validation',
    );
    expect(
      mapExamRequestWriteError(mockApiError({ status: 409, error: 'REQUEST_NOT_DRAFT' })),
    ).toBe('request_not_draft');
    expect(
      mapExamRequestWriteError(mockApiError({ status: 404, error: 'DOCUMENT_NOT_FOUND' })),
    ).toBe('document_not_found');
    expect(mapExamRequestWriteError(mockApiError({ status: 409, error: 'VERSION_CONFLICT' }))).toBe(
      'version_conflict',
    );
  });
});

describe('mapSaveDocumentItemError', () => {
  it('maps INVALID_DOCUMENT_NAME with escaped expectedName and ignores message', () => {
    expect(
      mapSaveDocumentItemError('HIST_ACAD', {
        error: 'INVALID_DOCUMENT_NAME',
        message: 'Invalid filename',
        details: { expectedName: 'Hist_Acad_Pena_Nunez_Maria_Jose.pdf' },
      }),
    ).toEqual({
      documentType: 'HIST_ACAD',
      key: 'EXAM_REQUEST.VALIDATION.INVALID_DOCUMENT_NAME',
      expectedName: 'Hist_Acad_Pena_Nunez_Maria_Jose.pdf',
      params: { expectedName: 'Hist_Acad_Pena_Nunez_Maria_Jose.pdf' },
    });
  });
});
