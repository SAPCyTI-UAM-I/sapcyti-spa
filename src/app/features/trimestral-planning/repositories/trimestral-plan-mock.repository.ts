import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { fromMockStore } from '../../../core/mocks/from-mock-store.util';
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
import { TrimestralPlanMockStore } from '../mocks/trimestral-plan-mock.store';
import { TrimestralPlanRepository } from './trimestral-plan.repository';

@Injectable()
export class TrimestralPlanMockRepository implements TrimestralPlanRepository {
  private readonly store = inject(TrimestralPlanMockStore);

  list(): Observable<TrimestralPlanSummary[]> {
    return fromMockStore(() => this.store.list());
  }

  get(id: number): Observable<TrimestralPlanDetail> {
    return fromMockStore(() => this.store.get(id));
  }

  generate(request: CreateTrimestralPlanRequest): Observable<TrimestralPlanDetail> {
    return fromMockStore(() => this.store.generate(request));
  }

  saveGroups(id: number, request: SaveTrimestralPlanRequest): Observable<TrimestralPlanDetail> {
    return fromMockStore(() => this.store.saveGroups(id, request));
  }

  regenerate(id: number): Observable<TrimestralPlanDetail> {
    return fromMockStore(() => this.store.regenerate(id));
  }

  changeStatus(
    id: number,
    request: ChangeTrimestralPlanStatusRequest,
  ): Observable<TrimestralPlanDetail> {
    return fromMockStore(() => this.store.changeStatus(id, request));
  }

  export(id: number): Observable<Blob> {
    return fromMockStore(() => this.store.export(id));
  }

  listSurveys(): Observable<SurveyResponse[]> {
    return fromMockStore(() => this.store.listSurveys());
  }

  searchProfessors(search: string): Observable<PageResponse<ProfessorCatalogItem>> {
    return fromMockStore(() => this.store.searchProfessors(search));
  }

  searchStudents(search: string): Observable<PageResponse<StudentCatalogItem>> {
    return fromMockStore(() => this.store.searchStudents(search));
  }

  searchUeas(search: string): Observable<PageResponse<UeaCatalogItem>> {
    return fromMockStore(() => this.store.searchUeas(search));
  }
}
