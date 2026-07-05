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

@Injectable()
export class ProfessorMockRepository implements ProfessorRepository {
  private readonly mockStore = inject(ProfessorMockStore);

  listProfessors(query: ProfessorCatalogQuery): Observable<PageResponse<ProfessorCatalogItem>> {
    return of(this.mockStore.listProfessors(query));
  }

  registerProfessor(request: RegisterProfessorRequest): Observable<RegisterProfessorResponse> {
    try {
      return of(this.mockStore.createProfessor(request));
    } catch (error) {
      return throwError(() => error);
    }
  }

  getProfessor(professorId: number): Observable<ProfessorDetailResponse> {
    try {
      return of(this.mockStore.getProfessor(professorId));
    } catch (error) {
      return throwError(() => error);
    }
  }

  updateProfessor(
    professorId: number,
    request: UpdateProfessorRequest,
  ): Observable<ProfessorDetailResponse> {
    try {
      return of(this.mockStore.updateProfessor(professorId, request));
    } catch (error) {
      return throwError(() => error);
    }
  }

  deactivateProfessor(professorId: number): Observable<ProfessorDetailResponse> {
    try {
      return of(this.mockStore.deactivateProfessor(professorId));
    } catch (error) {
      return throwError(() => error);
    }
  }

  restoreProfessor(professorId: number): Observable<ProfessorDetailResponse> {
    try {
      return of(this.mockStore.restoreProfessor(professorId));
    } catch (error) {
      return throwError(() => error);
    }
  }
}
