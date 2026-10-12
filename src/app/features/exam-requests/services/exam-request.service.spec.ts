import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { mockApiError } from '../../../core/errors/testing/mock-api-error.util';
import { EXAM_REQUEST_REPOSITORY } from '../repositories/exam-request.repository';
import { ExamRequestService } from './exam-request.service';

describe('ExamRequestService', () => {
  const mixedResponse = {
    request: null,
    version: 0,
    results: [
      {
        documentType: 'TESIS' as const,
        status: 'ERROR' as const,
        error: { error: 'INVALID_DOCUMENT_NAME', message: 'Invalid filename' },
      },
    ],
  };

  const repository = {
    getOptions: vi.fn(),
    getRequirements: vi.fn(),
    getPanel: vi.fn(),
    saveDocuments: vi.fn(() => of(mixedResponse)),
    replaceDocument: vi.fn(),
    deleteDocument: vi.fn(),
    getDocumentContent: vi.fn(() => of(new Blob(['%PDF-']))),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExamRequestService, { provide: EXAM_REQUEST_REPOSITORY, useValue: repository }],
    });
  });

  it('delegates a mixed 200 save without mapping it as an error', async () => {
    const service = TestBed.inject(ExamRequestService);
    const file = new File([new Uint8Array([0x25])], 'historia.pdf');

    await expect(
      firstValueFrom(
        service.saveDocuments('GRADO', 0, [{ documentType: 'TESIS', kind: 'PDF', file }]),
      ),
    ).resolves.toEqual(mixedResponse);
    expect(repository.saveDocuments).toHaveBeenCalledWith('GRADO', 0, [
      { documentType: 'TESIS', kind: 'PDF', file },
    ]);
  });

  it('maps write errors with the specialized mapper', () => {
    const service = TestBed.inject(ExamRequestService);

    expect(service.mapWriteError(mockApiError({ status: 400, error: 'VALIDATION_ERROR' }))).toBe(
      'save_validation',
    );
    expect(service.mapError(mockApiError({ status: 400, error: 'VALIDATION_ERROR' }))).toBe(
      'validation',
    );
    expect(
      service.mapContentError(
        mockApiError({ status: 404, error: 'DOCUMENT_NOT_FOUND', message: 'Document not found' }),
      ),
    ).toBe('document_not_found');
  });
});
