import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import {
  ChangeTrimestralPlanStatusRequest,
  CreateTrimestralPlanRequest,
  PageResponse,
  ProfessorCatalogItem,
  SaveTrimestralPlanRequest,
  StudentCatalogItem,
  SurveyResponse,
  TrimestralPlanDetail,
  TrimestralPlanSummary,
} from '../../../models';
import { TrimestralPlanRepository } from './trimestral-plan.repository';

/** Page size for the professor/student pickers; matches `ProfessorOptionsController`. */
const SEARCH_PAGE_SIZE = 30;

@Injectable()
export class TrimestralPlanHttpRepository implements TrimestralPlanRepository {
  private readonly http = inject(HttpClient);

  list(): Observable<TrimestralPlanSummary[]> {
    return this.http.get<TrimestralPlanSummary[]>(API_ENDPOINTS.trimestralPlans, {
      withCredentials: true,
    });
  }

  get(id: number): Observable<TrimestralPlanDetail> {
    return this.http.get<TrimestralPlanDetail>(API_ENDPOINTS.trimestralPlan(id), {
      withCredentials: true,
    });
  }

  generate(request: CreateTrimestralPlanRequest): Observable<TrimestralPlanDetail> {
    return this.http.post<TrimestralPlanDetail>(API_ENDPOINTS.trimestralPlans, request, {
      withCredentials: true,
    });
  }

  saveGroups(id: number, request: SaveTrimestralPlanRequest): Observable<TrimestralPlanDetail> {
    return this.http.put<TrimestralPlanDetail>(API_ENDPOINTS.trimestralPlanGroups(id), request, {
      withCredentials: true,
    });
  }

  regenerate(id: number): Observable<TrimestralPlanDetail> {
    return this.http.post<TrimestralPlanDetail>(
      API_ENDPOINTS.trimestralPlanRegenerate(id),
      {},
      { withCredentials: true },
    );
  }

  changeStatus(
    id: number,
    request: ChangeTrimestralPlanStatusRequest,
  ): Observable<TrimestralPlanDetail> {
    return this.http.patch<TrimestralPlanDetail>(API_ENDPOINTS.trimestralPlanStatus(id), request, {
      withCredentials: true,
    });
  }

  export(id: number): Observable<Blob> {
    return this.http.get(API_ENDPOINTS.trimestralPlanExport(id), {
      responseType: 'blob',
      withCredentials: true,
    });
  }

  listSurveys(): Observable<SurveyResponse[]> {
    return this.http.get<SurveyResponse[]>(API_ENDPOINTS.enrollmentSurveys, {
      withCredentials: true,
    });
  }

  searchProfessors(search: string): Observable<PageResponse<ProfessorCatalogItem>> {
    return this.http.get<PageResponse<ProfessorCatalogItem>>(API_ENDPOINTS.professors, {
      params: this.searchParams(search),
      withCredentials: true,
    });
  }

  searchStudents(search: string): Observable<PageResponse<StudentCatalogItem>> {
    return this.http.get<PageResponse<StudentCatalogItem>>(API_ENDPOINTS.students, {
      params: this.searchParams(search),
      withCredentials: true,
    });
  }

  private searchParams(search: string): HttpParams {
    let params = new HttpParams().set('page', 0).set('size', SEARCH_PAGE_SIZE).set('active', true);
    if (search) {
      params = params.set('search', search);
    }
    return params;
  }
}
