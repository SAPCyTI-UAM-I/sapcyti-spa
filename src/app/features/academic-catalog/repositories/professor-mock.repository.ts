import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { fromMockStore } from '../../../core/mocks/from-mock-store.util';
import { PageResponse } from '../../../models';
import {
  ProfessorCatalogItem,
  ProfessorCatalogQuery,
  ProfessorDetailResponse,
  RegisterProfessorRequest,
  RegisterProfessorResponse,
  UpdateProfessorRequest,
} from '../../../models';
import { ProfessorMockStore } from '../mocks/professor-mock.store';
import { ProfessorRepository } from './professor.repository';

@Injectable()
export class ProfessorMockRepository implements ProfessorRepository {
  private readonly mockStore = inject(ProfessorMockStore);

  listProfessors(query: ProfessorCatalogQuery): Observable<PageResponse<ProfessorCatalogItem>> {
    return of(this.mockStore.listProfessors(query));
  }

  registerProfessor(request: RegisterProfessorRequest): Observable<RegisterProfessorResponse> {
    return fromMockStore(() => this.mockStore.createProfessor(request));
  }

  getProfessor(professorId: number): Observable<ProfessorDetailResponse> {
    return fromMockStore(() => this.mockStore.getProfessor(professorId));
  }

  updateProfessor(
    professorId: number,
    request: UpdateProfessorRequest,
  ): Observable<ProfessorDetailResponse> {
    return fromMockStore(() => this.mockStore.updateProfessor(professorId, request));
  }

  deactivateProfessor(professorId: number): Observable<ProfessorDetailResponse> {
    return fromMockStore(() => this.mockStore.deactivateProfessor(professorId));
  }

  restoreProfessor(professorId: number): Observable<ProfessorDetailResponse> {
    return fromMockStore(() => this.mockStore.restoreProfessor(professorId));
  }
}
