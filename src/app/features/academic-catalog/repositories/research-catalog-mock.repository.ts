import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { RESEARCH_CATALOG, ResearchAreaCatalogItem } from '../../../models';
import { ResearchCatalogRepository } from './research-catalog.repository';

@Injectable()
export class ResearchCatalogMockRepository implements ResearchCatalogRepository {
  getResearchCatalog(): Observable<ResearchAreaCatalogItem[]> {
    return of([...RESEARCH_CATALOG] as ResearchAreaCatalogItem[]);
  }
}
