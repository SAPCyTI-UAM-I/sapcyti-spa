import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { PageResponse } from '../../../models/page-response.model';
import {
  ProfessorCatalogItem,
  ProfessorCatalogQuery,
  RegisterProfessorRequest,
  RegisterProfessorResponse,
} from '../../../models/professor.model';
import { AcademicCatalogMockStore } from '../mocks/academic-catalog-mock.store';
import { ProfessorRepository } from './professor.repository';

@Injectable()
export class ProfessorMockRepository implements ProfessorRepository {
  private readonly mockStore = inject(AcademicCatalogMockStore);

  listProfessors(query: ProfessorCatalogQuery): Observable<PageResponse<ProfessorCatalogItem>> {
    return of(this.mockStore.listProfessors(query));
  }

  registerProfessor(request: RegisterProfessorRequest): Observable<RegisterProfessorResponse> {
    return of(this.mockStore.createProfessor(request));
  }
}
