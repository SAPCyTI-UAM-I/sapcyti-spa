import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { PageResponse } from '../../../models';
import {
  ProfessorCatalogItem,
  ProfessorCatalogQuery,
  RegisterProfessorRequest,
  RegisterProfessorResponse,
} from '../../../models';
import { ProfessorRepository } from './professor.repository';

@Injectable()
export class ProfessorHttpRepository implements ProfessorRepository {
  private readonly http = inject(HttpClient);

  listProfessors(query: ProfessorCatalogQuery): Observable<PageResponse<ProfessorCatalogItem>> {
    let params = new HttpParams().set('page', query.page).set('size', query.size);
    if (query.search) params = params.set('search', query.search);
    if (query.active !== undefined) params = params.set('active', query.active);
    return this.http.get<PageResponse<ProfessorCatalogItem>>(API_ENDPOINTS.professors, {
      params,
      withCredentials: true,
    });
  }

  registerProfessor(request: RegisterProfessorRequest): Observable<RegisterProfessorResponse> {
    return this.http.post<RegisterProfessorResponse>(API_ENDPOINTS.professors, request, {
      withCredentials: true,
    });
  }
}
