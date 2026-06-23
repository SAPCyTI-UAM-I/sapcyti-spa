import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { PageResponse } from '../../../models';
import {
  ProfessorCatalogItem,
  ProfessorCatalogQuery,
  RegisterProfessorRequest,
  RegisterProfessorResponse,
} from '../../../models';

export interface ProfessorRepository {
  listProfessors(query: ProfessorCatalogQuery): Observable<PageResponse<ProfessorCatalogItem>>;
  registerProfessor(request: RegisterProfessorRequest): Observable<RegisterProfessorResponse>;
}

export const PROFESSOR_REPOSITORY = new InjectionToken<ProfessorRepository>('ProfessorRepository');
