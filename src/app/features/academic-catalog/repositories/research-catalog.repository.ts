import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { ResearchAreaCatalogItem } from '../../../models';

export interface ResearchCatalogRepository {
  getResearchCatalog(): Observable<ResearchAreaCatalogItem[]>;
}

export const RESEARCH_CATALOG_REPOSITORY = new InjectionToken<ResearchCatalogRepository>(
  'RESEARCH_CATALOG_REPOSITORY',
);
