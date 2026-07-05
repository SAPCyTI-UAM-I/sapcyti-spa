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

/** Runs the (synchronous) store call inside an Observable so thrown errors surface as `error`. */
function fromStore<T>(produce: () => T): Observable<T> {
  return defer(() => Promise.resolve(produce()));
}

@Injectable()
export class AnnualPlanMockRepository implements AnnualPlanRepository {
  private readonly store = inject(AnnualPlanMockStore);

  list(): Observable<AnnualPlanSummary[]> {
    return fromStore(() => this.store.list());
  }

  get(year: number): Observable<AnnualPlanDetail> {
    return fromStore(() => this.store.get(year));
  }

  check(file: File): Observable<FormatCheckReport> {
    return fromStore(() => this.store.check(file));
  }

  create(request: CreateAnnualPlanRequest): Observable<AnnualPlanDetail> {
    return fromStore(() => this.store.create(request));
  }

  saveEntries(year: number, request: SaveEntriesRequest): Observable<AnnualPlanDetail> {
    return fromStore(() => this.store.saveEntries(year, request));
  }

  changeStatus(year: number, request: ChangeStatusRequest): Observable<AnnualPlanSummary> {
    return fromStore(() => this.store.changeStatus(year, request));
  }

  export(year: number): Observable<Blob> {
    return fromStore(() => this.store.export(year));
  }
}
