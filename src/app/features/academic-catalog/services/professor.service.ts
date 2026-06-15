import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PageResponse } from '../../../models/page-response.model';
import {
  ProfessorCatalogItem,
  ProfessorCatalogQuery,
  RegisterProfessorRequest,
  RegisterProfessorResponse,
} from '../../../models/professor.model';
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
}
