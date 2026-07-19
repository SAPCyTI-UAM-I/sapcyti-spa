import { InjectionToken } from '@angular/core';
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

export interface TrimestralPlanRepository {
  list(): Observable<TrimestralPlanSummary[]>;
  get(id: number): Observable<TrimestralPlanDetail>;
  /** HU-58: generates the preview from a CERRADO survey. */
  generate(request: CreateTrimestralPlanRequest): Observable<TrimestralPlanDetail>;
  /** HU-59: replaces the full set of groups. */
  saveGroups(id: number, request: SaveTrimestralPlanRequest): Observable<TrimestralPlanDetail>;
  /** HU-58: discards manual edits and rebuilds from the survey. */
  regenerate(id: number): Observable<TrimestralPlanDetail>;
  changeStatus(
    id: number,
    request: ChangeTrimestralPlanStatusRequest,
  ): Observable<TrimestralPlanDetail>;
  /** HU-60: backend-generated .xlsx in the official format. */
  export(id: number): Observable<Blob>;
  /**
   * HU-58/59 reuse existing endpoints instead of adding search APIs. They live here
   * (not in the other features' services) because features must not import each other.
   */
  listSurveys(): Observable<SurveyResponse[]>;
  searchProfessors(search: string): Observable<PageResponse<ProfessorCatalogItem>>;
  searchStudents(search: string): Observable<PageResponse<StudentCatalogItem>>;
  /** HU-59: catálogo activo para elegir la UEA de un grupo nuevo. */
  searchUeas(search: string): Observable<PageResponse<UeaCatalogItem>>;
}

export const TRIMESTRAL_PLAN_REPOSITORY = new InjectionToken<TrimestralPlanRepository>(
  'TrimestralPlanRepository',
);
