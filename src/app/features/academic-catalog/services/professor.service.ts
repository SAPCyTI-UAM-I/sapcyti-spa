import { inject, Injectable } from '@angular/core';
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
import { PROFESSOR_REPOSITORY } from '../repositories/professor.repository';

@Injectable({ providedIn: 'root' })
export class ProfessorService {
  private readonly repository = inject(PROFESSOR_REPOSITORY);

  listProfessors(query: ProfessorCatalogQuery): Observable<PageResponse<ProfessorCatalogItem>> {
    return this.repository.listProfessors(query);
  }

  registerProfessor(request: RegisterProfessorRequest): Observable<RegisterProfessorResponse> {
    return this.repository.registerProfessor(request);
  }

  getProfessor(professorId: number): Observable<ProfessorDetailResponse> {
    return this.repository.getProfessor(professorId);
  }

  updateProfessor(
    professorId: number,
    request: UpdateProfessorRequest,
  ): Observable<ProfessorDetailResponse> {
    return this.repository.updateProfessor(professorId, request);
  }

  deactivateProfessor(professorId: number): Observable<ProfessorDetailResponse> {
    return this.repository.deactivateProfessor(professorId);
  }
}
