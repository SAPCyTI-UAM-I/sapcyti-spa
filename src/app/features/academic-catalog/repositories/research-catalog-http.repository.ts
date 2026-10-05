import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { ResearchAreaCatalogItem } from '../../../models';
import { ResearchCatalogRepository } from './research-catalog.repository';

@Injectable()
export class ResearchCatalogHttpRepository implements ResearchCatalogRepository {
  private readonly http = inject(HttpClient);

  getResearchCatalog(): Observable<ResearchAreaCatalogItem[]> {
    return this.http.get<ResearchAreaCatalogItem[]>(API_ENDPOINTS.researchCatalog, {
      withCredentials: true,
    });
  }
}
