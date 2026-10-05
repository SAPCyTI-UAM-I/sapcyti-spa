import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { PageResponse } from '../../../models';
import {
  ProfessorCatalogItem,
  ProfessorCatalogQuery,
  ProfessorDetailResponse,
  RegisterProfessorRequest,
  RegisterProfessorResponse,
  UpdateProfessorRequest,
} from '../../../models';

export interface ProfessorRepository {
  listProfessors(query: ProfessorCatalogQuery): Observable<PageResponse<ProfessorCatalogItem>>;
  registerProfessor(request: RegisterProfessorRequest): Observable<RegisterProfessorResponse>;
  getProfessor(professorId: number): Observable<ProfessorDetailResponse>;
  updateProfessor(
    professorId: number,
    request: UpdateProfessorRequest,
  ): Observable<ProfessorDetailResponse>;
  deactivateProfessor(professorId: number): Observable<ProfessorDetailResponse>;
  restoreProfessor(professorId: number): Observable<ProfessorDetailResponse>;
}

export const PROFESSOR_REPOSITORY = new InjectionToken<ProfessorRepository>('ProfessorRepository');
