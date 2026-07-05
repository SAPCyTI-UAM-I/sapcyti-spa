import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

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

/** Runs the (synchronous) store call, surfacing thrown mock errors as `error`. */
function fromStore<T>(produce: () => T): Observable<T> {
  try {
    return of(produce());
  } catch (error) {
    return throwError(() => error);
  }
}

@Injectable()
export class ProfessorMockRepository implements ProfessorRepository {
  private readonly mockStore = inject(ProfessorMockStore);

  listProfessors(query: ProfessorCatalogQuery): Observable<PageResponse<ProfessorCatalogItem>> {
    return of(this.mockStore.listProfessors(query));
  }

  registerProfessor(request: RegisterProfessorRequest): Observable<RegisterProfessorResponse> {
    return fromStore(() => this.mockStore.createProfessor(request));
  }

  getProfessor(professorId: number): Observable<ProfessorDetailResponse> {
    return fromStore(() => this.mockStore.getProfessor(professorId));
  }

  updateProfessor(
    professorId: number,
    request: UpdateProfessorRequest,
  ): Observable<ProfessorDetailResponse> {
    return fromStore(() => this.mockStore.updateProfessor(professorId, request));
  }

  deactivateProfessor(professorId: number): Observable<ProfessorDetailResponse> {
    return fromStore(() => this.mockStore.deactivateProfessor(professorId));
  }

  restoreProfessor(professorId: number): Observable<ProfessorDetailResponse> {
    return fromStore(() => this.mockStore.restoreProfessor(professorId));
  }
}
