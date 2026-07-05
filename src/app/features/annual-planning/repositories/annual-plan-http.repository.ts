import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import {
  AnnualPlanDetail,
  AnnualPlanSummary,
  ChangeStatusRequest,
  CreateAnnualPlanRequest,
  FormatCheckReport,
  SaveEntriesRequest,
} from '../../../models';
import { AnnualPlanRepository } from './annual-plan.repository';

@Injectable()
export class AnnualPlanHttpRepository implements AnnualPlanRepository {
  private readonly http = inject(HttpClient);

  list(): Observable<AnnualPlanSummary[]> {
    return this.http.get<AnnualPlanSummary[]>(API_ENDPOINTS.annualPlans, {
      withCredentials: true,
    });
  }

  get(year: number): Observable<AnnualPlanDetail> {
    return this.http.get<AnnualPlanDetail>(API_ENDPOINTS.annualPlan(year), {
      withCredentials: true,
    });
  }

  check(file: File): Observable<FormatCheckReport> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<FormatCheckReport>(API_ENDPOINTS.annualPlansCheck, formData, {
      withCredentials: true,
    });
  }

  create(request: CreateAnnualPlanRequest): Observable<AnnualPlanDetail> {
    return this.http.post<AnnualPlanDetail>(API_ENDPOINTS.annualPlans, request, {
      withCredentials: true,
    });
  }

  saveEntries(year: number, request: SaveEntriesRequest): Observable<AnnualPlanDetail> {
    return this.http.put<AnnualPlanDetail>(API_ENDPOINTS.annualPlanEntries(year), request, {
      withCredentials: true,
    });
  }

  changeStatus(year: number, request: ChangeStatusRequest): Observable<AnnualPlanSummary> {
    return this.http.patch<AnnualPlanSummary>(API_ENDPOINTS.annualPlanStatus(year), request, {
      withCredentials: true,
    });
  }

  export(year: number): Observable<Blob> {
    return this.http.get(API_ENDPOINTS.annualPlanExport(year), {
      responseType: 'blob',
      withCredentials: true,
    });
  }
}
