import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ChangeTrimestralPlanStatusRequest,
  CreateTrimestralPlanRequest,
  PageResponse,
  ProfessorCatalogItem,
  SaveTrimestralPlanRequest,
  StudentCatalogItem,
  SurveyResponse,
  UeaCatalogItem,
  TrimestralPlanDetail,
  TrimestralPlanSummary,
} from '../../../models';
import { TRIMESTRAL_PLAN_REPOSITORY } from '../repositories/trimestral-plan.repository';

@Injectable({ providedIn: 'root' })
export class TrimestralPlanService {
  private readonly repository = inject(TRIMESTRAL_PLAN_REPOSITORY);

  list(): Observable<TrimestralPlanSummary[]> {
    return this.repository.list();
  }

  get(id: number): Observable<TrimestralPlanDetail> {
    return this.repository.get(id);
  }

  generate(request: CreateTrimestralPlanRequest): Observable<TrimestralPlanDetail> {
    return this.repository.generate(request);
  }

  saveGroups(id: number, request: SaveTrimestralPlanRequest): Observable<TrimestralPlanDetail> {
    return this.repository.saveGroups(id, request);
  }

  regenerate(id: number): Observable<TrimestralPlanDetail> {
    return this.repository.regenerate(id);
  }

  changeStatus(
    id: number,
    request: ChangeTrimestralPlanStatusRequest,
  ): Observable<TrimestralPlanDetail> {
    return this.repository.changeStatus(id, request);
  }

  export(id: number): Observable<Blob> {
    return this.repository.export(id);
  }

  listSurveys(): Observable<SurveyResponse[]> {
    return this.repository.listSurveys();
  }

  searchProfessors(search: string): Observable<PageResponse<ProfessorCatalogItem>> {
    return this.repository.searchProfessors(search);
  }

  searchStudents(search: string): Observable<PageResponse<StudentCatalogItem>> {
    return this.repository.searchStudents(search);
  }

  searchUeas(search: string): Observable<PageResponse<UeaCatalogItem>> {
    return this.repository.searchUeas(search);
  }
}
