import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AnnualPlanDetail,
  AnnualPlanSummary,
  ChangeStatusRequest,
  CreateAnnualPlanRequest,
  FormatCheckReport,
  SaveEntriesRequest,
} from '../../../models';
import { ANNUAL_PLAN_REPOSITORY } from '../repositories/annual-plan.repository';

@Injectable({ providedIn: 'root' })
export class AnnualPlanService {
  private readonly repository = inject(ANNUAL_PLAN_REPOSITORY);

  list(): Observable<AnnualPlanSummary[]> {
    return this.repository.list();
  }

  get(year: number): Observable<AnnualPlanDetail> {
    return this.repository.get(year);
  }

  check(file: File): Observable<FormatCheckReport> {
    return this.repository.check(file);
  }

  create(request: CreateAnnualPlanRequest): Observable<AnnualPlanDetail> {
    return this.repository.create(request);
  }

  saveEntries(year: number, request: SaveEntriesRequest): Observable<AnnualPlanDetail> {
    return this.repository.saveEntries(year, request);
  }

  changeStatus(year: number, request: ChangeStatusRequest): Observable<AnnualPlanSummary> {
    return this.repository.changeStatus(year, request);
  }

  export(year: number): Observable<Blob> {
    return this.repository.export(year);
  }
}
