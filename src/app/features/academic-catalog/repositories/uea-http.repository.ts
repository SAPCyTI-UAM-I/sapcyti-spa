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
} from '../../../models';
import { UeaRepository } from './uea.repository';

@Injectable()
export class UeaHttpRepository implements UeaRepository {
  private readonly http = inject(HttpClient);

  listUeas(query: UeaCatalogQuery): Observable<PageResponse<UeaCatalogItem>> {
    let params = new HttpParams().set('page', query.page).set('size', query.size);
    if (query.search) params = params.set('search', query.search);
    if (query.active !== undefined) params = params.set('active', query.active);
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
}
