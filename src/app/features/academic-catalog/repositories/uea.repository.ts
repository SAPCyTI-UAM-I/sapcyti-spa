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
  deactivateUea(ueaId: number): Observable<UeaCatalogItem>;
  restoreUea(ueaId: number): Observable<UeaCatalogItem>;
}

export const UEA_REPOSITORY = new InjectionToken<UeaRepository>('UeaRepository');
