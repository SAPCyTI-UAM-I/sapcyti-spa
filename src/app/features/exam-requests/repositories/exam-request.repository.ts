import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import {
  DeleteDocumentRequest,
  DocumentType,
  ExamOptionsDto,
  ExamPanelResponse,
  ExamRequirementsResponse,
  ExamType,
  MutationResponse,
  PutUrlRequest,
  SaveDocumentsResponse,
} from '../../../models';
import type { SaveDocumentSelection } from '../utils/exam-document-form-data.util';

/** Query de GET content. Ausente en el path; el repositorio la añade. */
export type DocumentContentDisposition = 'inline' | 'attachment';

/** PUT PDF usa archivo; PUT artículo URL usa el JSON del contrato. */
export type ReplaceDocumentCommand =
  | { readonly kind: 'PDF'; readonly version: number; readonly file: File }
  | PutUrlRequest;

export interface ExamRequestRepository {
  getOptions(): Observable<ExamOptionsDto>;
  getRequirements(examType: ExamType): Observable<ExamRequirementsResponse>;
  getPanel(examType: ExamType): Observable<ExamPanelResponse>;
  saveDocuments(
    examType: ExamType,
    version: number,
    selections: readonly SaveDocumentSelection[],
  ): Observable<SaveDocumentsResponse>;
  replaceDocument(
    examType: ExamType,
    documentType: DocumentType,
    command: ReplaceDocumentCommand,
  ): Observable<MutationResponse>;
  deleteDocument(
    examType: ExamType,
    documentType: DocumentType,
    request: DeleteDocumentRequest,
  ): Observable<MutationResponse>;
  getDocumentContent(
    examType: ExamType,
    documentType: DocumentType,
    disposition: DocumentContentDisposition,
  ): Observable<Blob>;
}

export const EXAM_REQUEST_REPOSITORY = new InjectionToken<ExamRequestRepository>(
  'ExamRequestRepository',
);
