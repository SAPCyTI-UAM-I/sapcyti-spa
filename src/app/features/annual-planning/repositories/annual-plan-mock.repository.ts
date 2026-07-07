import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { fromMockStore } from '../../../core/mocks/from-mock-store.util';
import {
  AnnualPlanDetail,
  AnnualPlanSummary,
  ChangeStatusRequest,
  CreateAnnualPlanRequest,
  FormatCheckReport,
  SaveEntriesRequest,
} from '../../../models';
import { AnnualPlanMockStore } from '../mocks/annual-plan-mock.store';
import { AnnualPlanRepository } from './annual-plan.repository';

@Injectable()
export class AnnualPlanMockRepository implements AnnualPlanRepository {
  private readonly store = inject(AnnualPlanMockStore);

  list(): Observable<AnnualPlanSummary[]> {
    return fromMockStore(() => this.store.list());
  }

  get(year: number): Observable<AnnualPlanDetail> {
    return fromMockStore(() => this.store.get(year));
  }

  check(file: File): Observable<FormatCheckReport> {
    return fromMockStore(() => this.store.check(file));
  }

  create(request: CreateAnnualPlanRequest): Observable<AnnualPlanDetail> {
    return fromMockStore(() => this.store.create(request));
  }

  saveEntries(year: number, request: SaveEntriesRequest): Observable<AnnualPlanDetail> {
    return fromMockStore(() => this.store.saveEntries(year, request));
  }

  changeStatus(year: number, request: ChangeStatusRequest): Observable<AnnualPlanSummary> {
    return fromMockStore(() => this.store.changeStatus(year, request));
  }

  export(year: number): Observable<Blob> {
    return fromMockStore(() => this.store.export(year));
  }
}
