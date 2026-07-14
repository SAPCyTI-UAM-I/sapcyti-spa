import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import {
  CreateSurveyRequest,
  InterestedStudent,
  PageResponse,
  StudentSurveyForm,
  SubmitResponseRequest,
  SubmittedResponse,
  SurveyResponse,
  SurveyResultsSummary,
  UeaDemandRow,
  UpdateSurveyRequest,
} from '../../../models';
import { EnrollmentSurveyRepository, UeaDemandSort } from './enrollment-survey.repository';

@Injectable()
export class EnrollmentSurveyHttpRepository implements EnrollmentSurveyRepository {
  private readonly http = inject(HttpClient);

  listSurveys(): Observable<SurveyResponse[]> {
    return this.http.get<SurveyResponse[]>(API_ENDPOINTS.enrollmentSurveys, {
      withCredentials: true,
    });
  }

  getSurvey(id: number): Observable<SurveyResponse> {
    return this.http.get<SurveyResponse>(API_ENDPOINTS.enrollmentSurvey(id), {
      withCredentials: true,
    });
  }

  createSurvey(request: CreateSurveyRequest): Observable<SurveyResponse> {
    return this.http.post<SurveyResponse>(API_ENDPOINTS.enrollmentSurveys, request, {
      withCredentials: true,
    });
  }

  updateSurvey(id: number, request: UpdateSurveyRequest): Observable<SurveyResponse> {
    return this.http.put<SurveyResponse>(API_ENDPOINTS.enrollmentSurvey(id), request, {
      withCredentials: true,
    });
  }

  closeSurvey(id: number): Observable<SurveyResponse> {
    return this.http.put<SurveyResponse>(
      API_ENDPOINTS.enrollmentSurveyClose(id),
      {},
      { withCredentials: true },
    );
  }

  deleteSurvey(id: number): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.enrollmentSurvey(id), { withCredentials: true });
  }

  hasActiveUeas(): Observable<boolean> {
    const params = new HttpParams().set('page', 0).set('size', 1).set('active', true);
    return this.http
      .get<PageResponse<unknown>>(API_ENDPOINTS.ueas, { params, withCredentials: true })
      .pipe(map((page) => page.totalElements > 0));
  }

  getActiveSurvey(): Observable<StudentSurveyForm | null> {
    return this.http
      .get<StudentSurveyForm>(API_ENDPOINTS.enrollmentSurveyActive, { withCredentials: true })
      .pipe(
        // 404 = no active survey → empty state, not an error. Any other error propagates.
        catchError((error: unknown) =>
          error instanceof HttpErrorResponse && error.status === 404
            ? of(null)
            : throwError(() => error),
        ),
      );
  }

  submitResponse(id: number, request: SubmitResponseRequest): Observable<SubmittedResponse> {
    return this.http.post<SubmittedResponse>(API_ENDPOINTS.enrollmentSurveyResponses(id), request, {
      withCredentials: true,
    });
  }

  getMyResponse(id: number): Observable<SubmittedResponse> {
    return this.http.get<SubmittedResponse>(API_ENDPOINTS.enrollmentSurveyMyResponse(id), {
      withCredentials: true,
    });
  }

  getResultsSummary(id: number): Observable<SurveyResultsSummary> {
    return this.http.get<SurveyResultsSummary>(API_ENDPOINTS.enrollmentSurveyResultsSummary(id), {
      withCredentials: true,
    });
  }

  getResultsUeas(id: number, sort?: UeaDemandSort): Observable<UeaDemandRow[]> {
    let params = new HttpParams();
    if (sort) params = params.set('sort', sort);
    return this.http.get<UeaDemandRow[]>(API_ENDPOINTS.enrollmentSurveyResultsUeas(id), {
      params,
      withCredentials: true,
    });
  }

  getResultsUeaStudents(id: number, ueaId: number): Observable<InterestedStudent[]> {
    return this.http.get<InterestedStudent[]>(
      API_ENDPOINTS.enrollmentSurveyResultsUeaStudents(id, ueaId),
      { withCredentials: true },
    );
  }
}
