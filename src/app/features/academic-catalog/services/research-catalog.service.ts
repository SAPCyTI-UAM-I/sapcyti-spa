import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ResearchAreaCatalogItem } from '../../../models';
import { RESEARCH_CATALOG_REPOSITORY } from '../repositories/research-catalog.repository';

@Injectable({ providedIn: 'root' })
export class ResearchCatalogService {
  private readonly repository = inject(RESEARCH_CATALOG_REPOSITORY);

  getResearchCatalog(): Observable<ResearchAreaCatalogItem[]> {
    return this.repository.getResearchCatalog();
  }
}
