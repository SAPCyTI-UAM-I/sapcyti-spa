import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import {
  PageResponse,
  RegisterUeaRequest,
  UeaBulkUploadResult,
  UeaCatalogItem,
  UeaCatalogQuery,
} from '../../../models';

export interface UeaRepository {
  listUeas(query: UeaCatalogQuery): Observable<PageResponse<UeaCatalogItem>>;
  registerUea(request: RegisterUeaRequest): Observable<UeaCatalogItem>;
  bulkUploadUeas(file: File): Observable<UeaBulkUploadResult>;
}

export const UEA_REPOSITORY = new InjectionToken<UeaRepository>('UeaRepository');
