import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { PageResponse } from '../../../models/page-response.model';
import {
  ProfessorCatalogItem,
  ProfessorCatalogQuery,
  RegisterProfessorRequest,
  RegisterProfessorResponse,
} from '../../../models/professor.model';

export interface ProfessorRepository {
  listProfessors(query: ProfessorCatalogQuery): Observable<PageResponse<ProfessorCatalogItem>>;
  registerProfessor(request: RegisterProfessorRequest): Observable<RegisterProfessorResponse>;
}

export const PROFESSOR_REPOSITORY = new InjectionToken<ProfessorRepository>('ProfessorRepository');
