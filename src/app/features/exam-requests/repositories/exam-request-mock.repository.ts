import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { fromMockStore } from '../../../core/mocks/from-mock-store.util';
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
import { ExamRequestMockStore } from '../mocks/exam-request-mock.store';
import type { SaveDocumentSelection } from '../utils/exam-document-form-data.util';
import { ExamRequestRepository, type ReplaceDocumentCommand } from './exam-request.repository';

@Injectable()
export class ExamRequestMockRepository implements ExamRequestRepository {
  private readonly store = inject(ExamRequestMockStore);

  getOptions(): Observable<ExamOptionsDto> {
    return fromMockStore(() => this.store.getOptions());
  }

  getRequirements(examType: ExamType): Observable<ExamRequirementsResponse> {
    return fromMockStore(() => this.store.getRequirements(examType));
  }

  getPanel(examType: ExamType): Observable<ExamPanelResponse> {
    return fromMockStore(() => this.store.getPanel(examType));
  }

  saveDocuments(
    examType: ExamType,
    version: number,
    selections: readonly SaveDocumentSelection[],
  ): Observable<SaveDocumentsResponse> {
    return fromMockStore(() => this.store.saveDocuments(examType, version, selections));
  }

  replaceDocument(
    examType: ExamType,
    documentType: DocumentType,
    command: ReplaceDocumentCommand,
  ): Observable<MutationResponse> {
    return fromMockStore(() => this.store.replaceDocument(examType, documentType, command));
  }

  deleteDocument(
    examType: ExamType,
    documentType: DocumentType,
    request: DeleteDocumentRequest,
  ): Observable<MutationResponse> {
    return fromMockStore(() => this.store.deleteDocument(examType, documentType, request.version));
  }
}
