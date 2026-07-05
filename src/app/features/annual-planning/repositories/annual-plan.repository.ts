import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AnnualPlanDetail,
  AnnualPlanSummary,
  ChangeStatusRequest,
  CreateAnnualPlanRequest,
  FormatCheckReport,
  SaveEntriesRequest,
} from '../../../models';

export interface AnnualPlanRepository {
  list(): Observable<AnnualPlanSummary[]>;
  get(year: number): Observable<AnnualPlanDetail>;
  /** HU-49: parse + compare the uploaded .xlsx against the active catalog. */
  check(file: File): Observable<FormatCheckReport>;
  create(request: CreateAnnualPlanRequest): Observable<AnnualPlanDetail>;
  /** HU-51: full replacement of all editable cells (all-or-nothing). */
  saveEntries(year: number, request: SaveEntriesRequest): Observable<AnnualPlanDetail>;
  changeStatus(year: number, request: ChangeStatusRequest): Observable<AnnualPlanSummary>;
  /** HU-52: backend-generated .xlsx of the plan. */
  export(year: number): Observable<Blob>;
}

export const ANNUAL_PLAN_REPOSITORY = new InjectionToken<AnnualPlanRepository>(
  'AnnualPlanRepository',
);
