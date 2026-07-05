import { inject, Injectable } from '@angular/core';
import { defer, Observable } from 'rxjs';

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
    return defer(() => Promise.resolve(this.store.list()));
  }

  get(year: number): Observable<AnnualPlanDetail> {
    return defer(() => Promise.resolve(this.store.get(year)));
  }

  check(file: File): Observable<FormatCheckReport> {
    return defer(() => Promise.resolve(this.store.check(file)));
  }

  create(request: CreateAnnualPlanRequest): Observable<AnnualPlanDetail> {
    return defer(() => Promise.resolve(this.store.create(request)));
  }

  saveEntries(year: number, request: SaveEntriesRequest): Observable<AnnualPlanDetail> {
    return defer(() => Promise.resolve(this.store.saveEntries(year, request)));
  }

  changeStatus(year: number, request: ChangeStatusRequest): Observable<AnnualPlanSummary> {
    return defer(() => Promise.resolve(this.store.changeStatus(year, request)));
  }

  export(year: number): Observable<Blob> {
    return defer(() => Promise.resolve(this.store.export(year)));
  }
}
