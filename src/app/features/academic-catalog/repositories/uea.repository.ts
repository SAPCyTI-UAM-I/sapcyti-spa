import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import {
  PageResponse,
  RegisterUeaRequest,
  UeaBulkUploadResult,
  UeaCatalogItem,
  UeaCatalogQuery,
  UpdateUeaRequest,
} from '../../../models';

export interface UeaRepository {
  listUeas(query: UeaCatalogQuery): Observable<PageResponse<UeaCatalogItem>>;
  registerUea(request: RegisterUeaRequest): Observable<UeaCatalogItem>;
  bulkUploadUeas(file: File): Observable<UeaBulkUploadResult>;
  getUea(ueaId: number): Observable<UeaCatalogItem>;
  updateUea(ueaId: number, request: UpdateUeaRequest): Observable<UeaCatalogItem>;
  /**
   * HU-48. When the UEA is in an active survey and `confirm` is not true, the backend
   * responds `409 UEA_IN_ACTIVE_SURVEY` (with the term in the message) instead of
   * deactivating. The SPA confirms and retries with `confirm = true`.
   */
  deactivateUea(ueaId: number, confirm?: boolean): Observable<UeaCatalogItem>;
  restoreUea(ueaId: number): Observable<UeaCatalogItem>;
}

export const UEA_REPOSITORY = new InjectionToken<UeaRepository>('UeaRepository');
