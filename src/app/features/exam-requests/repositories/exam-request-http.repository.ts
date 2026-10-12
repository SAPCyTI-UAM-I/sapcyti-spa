import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, from, Observable, switchMap, throwError } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { normalizeBlobError } from '../../../core/errors/utils/normalize-blob-error.util';
import { EXAM_STUDENT_OPERATION } from '../../../core/http/tokens/exam-context.tokens';
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
  buildReplacePdfFormData,
  buildSaveDocumentsFormData,
  type SaveDocumentSelection,
} from '../utils/exam-document-form-data.util';
import {
  ExamRequestRepository,
  type DocumentContentDisposition,
  type ReplaceDocumentCommand,
} from './exam-request.repository';

/** Marca escrituras para que el interceptor conserve PROGRAM_NOT_ELIGIBLE. */
function examWriteContext(): HttpContext {
  return new HttpContext().set(EXAM_STUDENT_OPERATION, true);
}

@Injectable()
export class ExamRequestHttpRepository implements ExamRequestRepository {
  private readonly http = inject(HttpClient);

  getOptions(): Observable<ExamOptionsDto> {
    return this.http.get<ExamOptionsDto>(API_ENDPOINTS.examRequests.me.options, {
      withCredentials: true,
    });
  }

  getRequirements(examType: ExamType): Observable<ExamRequirementsResponse> {
    return this.http.get<ExamRequirementsResponse>(
      API_ENDPOINTS.examRequests.me.requirements(examType),
      { withCredentials: true },
    );
  }

  getPanel(examType: ExamType): Observable<ExamPanelResponse> {
    return this.http.get<ExamPanelResponse>(API_ENDPOINTS.examRequests.me.panel(examType), {
      withCredentials: true,
    });
  }

  saveDocuments(
    examType: ExamType,
    version: number,
    selections: readonly SaveDocumentSelection[],
  ): Observable<SaveDocumentsResponse> {
    const formData = buildSaveDocumentsFormData(version, selections);
    return this.http.post<SaveDocumentsResponse>(
      API_ENDPOINTS.examRequests.me.documents(examType),
      formData,
      { withCredentials: true, context: examWriteContext() },
    );
  }

  replaceDocument(
    examType: ExamType,
    documentType: DocumentType,
    command: ReplaceDocumentCommand,
  ): Observable<MutationResponse> {
    const url = API_ENDPOINTS.examRequests.me.document(examType, documentType);
    const context = examWriteContext();

    if (command.kind === 'PDF') {
      return this.http.put<MutationResponse>(
        url,
        buildReplacePdfFormData(command.version, command.file),
        { withCredentials: true, context },
      );
    }

    return this.http.put<MutationResponse>(url, command, { withCredentials: true, context });
  }

  deleteDocument(
    examType: ExamType,
    documentType: DocumentType,
    request: DeleteDocumentRequest,
  ): Observable<MutationResponse> {
    return this.http.request<MutationResponse>(
      'DELETE',
      API_ENDPOINTS.examRequests.me.document(examType, documentType),
      { body: request, withCredentials: true, context: examWriteContext() },
    );
  }

  /**
   * PDF vigente. disposition viaja como query; un error JSON llega como Blob
   * y se normaliza antes del mapper.
   */
  getDocumentContent(
    examType: ExamType,
    documentType: DocumentType,
    disposition: DocumentContentDisposition,
  ): Observable<Blob> {
    return this.http
      .get(API_ENDPOINTS.examRequests.me.content(examType, documentType), {
        params: new HttpParams().set('disposition', disposition),
        responseType: 'blob',
        headers: new HttpHeaders({ Accept: 'application/pdf' }),
        withCredentials: true,
        context: examWriteContext(),
      })
      .pipe(
        catchError((error: unknown) =>
          from(normalizeBlobError(error)).pipe(
            switchMap((normalized) => throwError(() => normalized)),
          ),
        ),
      );
  }
}
