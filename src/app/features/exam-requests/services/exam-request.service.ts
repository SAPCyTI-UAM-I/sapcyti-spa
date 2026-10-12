import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  DeleteDocumentRequest,
  DocumentType,
  ExamOptionsDto,
  ExamPanelResponse,
  ExamRequirementsResponse,
  ExamType,
  MutationResponse,
  SaveDocumentsResponse,
} from '../../../models';
import {
  EXAM_REQUEST_REPOSITORY,
  type DocumentContentDisposition,
  type ReplaceDocumentCommand,
} from '../repositories/exam-request.repository';
import type { SaveDocumentSelection } from '../utils/exam-document-form-data.util';
import {
  ExamRequestContentError,
  ExamRequestError,
  ExamRequestWriteError,
  mapExamRequestContentError,
  mapExamRequestError,
  mapExamRequestWriteError,
} from '../utils/exam-request-error.util';

@Injectable({ providedIn: 'root' })
export class ExamRequestService {
  private readonly repository = inject(EXAM_REQUEST_REPOSITORY);

  getOptions(): Observable<ExamOptionsDto> {
    return this.repository.getOptions();
  }

  getRequirements(examType: ExamType = 'GRADO'): Observable<ExamRequirementsResponse> {
    return this.repository.getRequirements(examType);
  }

  getPanel(examType: ExamType): Observable<ExamPanelResponse> {
    return this.repository.getPanel(examType);
  }

  saveDocuments(
    examType: ExamType,
    version: number,
    selections: readonly SaveDocumentSelection[],
  ): Observable<SaveDocumentsResponse> {
    return this.repository.saveDocuments(examType, version, selections);
  }

  replaceDocument(
    examType: ExamType,
    documentType: DocumentType,
    command: ReplaceDocumentCommand,
  ): Observable<MutationResponse> {
    return this.repository.replaceDocument(examType, documentType, command);
  }

  deleteDocument(
    examType: ExamType,
    documentType: DocumentType,
    request: DeleteDocumentRequest,
  ): Observable<MutationResponse> {
    return this.repository.deleteDocument(examType, documentType, request);
  }

  getDocumentContent(
    examType: ExamType,
    documentType: DocumentType,
    disposition: DocumentContentDisposition,
  ): Observable<Blob> {
    return this.repository.getDocumentContent(examType, documentType, disposition);
  }

  mapError(error: unknown): ExamRequestError {
    return mapExamRequestError(error);
  }

  /** Errores globales de escritura; no usar con HTTP 200 mixto. */
  mapWriteError(error: unknown): ExamRequestWriteError {
    return mapExamRequestWriteError(error);
  }

  /** Errores de GET content ya normalizados; no expone message. */
  mapContentError(error: unknown): ExamRequestContentError {
    return mapExamRequestContentError(error);
  }
}
