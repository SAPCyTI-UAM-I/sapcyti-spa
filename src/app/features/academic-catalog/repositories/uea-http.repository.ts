import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import {
  PageResponse,
  RegisterUeaRequest,
  UeaBulkUploadResult,
  UeaCatalogItem,
  UeaCatalogQuery,
  UpdateUeaRequest,
} from '../../../models';
import { UeaRepository } from './uea.repository';

@Injectable()
export class UeaHttpRepository implements UeaRepository {
  private readonly http = inject(HttpClient);

  listUeas(query: UeaCatalogQuery): Observable<PageResponse<UeaCatalogItem>> {
    let params = new HttpParams().set('page', query.page).set('size', query.size);
    if (query.search) params = params.set('search', query.search);
    if (query.active !== undefined) params = params.set('active', query.active);
    if (query.sort) params = params.set('sort', query.sort);
    return this.http.get<PageResponse<UeaCatalogItem>>(API_ENDPOINTS.ueas, {
      params,
      withCredentials: true,
    });
  }

  registerUea(request: RegisterUeaRequest): Observable<UeaCatalogItem> {
    return this.http.post<UeaCatalogItem>(API_ENDPOINTS.ueas, request, {
      withCredentials: true,
    });
  }

  bulkUploadUeas(file: File): Observable<UeaBulkUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UeaBulkUploadResult>(API_ENDPOINTS.ueasBulk, formData, {
      withCredentials: true,
    });
  }

  getUea(ueaId: number): Observable<UeaCatalogItem> {
    return this.http.get<UeaCatalogItem>(API_ENDPOINTS.uea(ueaId), { withCredentials: true });
  }

  updateUea(ueaId: number, request: UpdateUeaRequest): Observable<UeaCatalogItem> {
    return this.http.put<UeaCatalogItem>(API_ENDPOINTS.uea(ueaId), request, {
      withCredentials: true,
    });
  }

  deactivateUea(ueaId: number, confirm = false): Observable<UeaCatalogItem> {
    const params = confirm ? new HttpParams().set('confirm', true) : undefined;
    return this.http.put<UeaCatalogItem>(
      API_ENDPOINTS.ueaDeactivate(ueaId),
      {},
      { params, withCredentials: true },
    );
  }

  restoreUea(ueaId: number): Observable<UeaCatalogItem> {
    return this.http.put<UeaCatalogItem>(
      API_ENDPOINTS.ueaRestore(ueaId),
      {},
      { withCredentials: true },
    );
  }
}
