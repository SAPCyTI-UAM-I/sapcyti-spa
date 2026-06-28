import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  PageResponse,
  RegisterUeaRequest,
  UeaBulkUploadResult,
  UeaCatalogItem,
  UeaCatalogQuery,
} from '../../../models';
import { UEA_REPOSITORY } from '../repositories/uea.repository';

@Injectable({ providedIn: 'root' })
export class UeaService {
  private readonly repository = inject(UEA_REPOSITORY);

  listUeas(query: UeaCatalogQuery): Observable<PageResponse<UeaCatalogItem>> {
    return this.repository.listUeas(query);
  }

  registerUea(request: RegisterUeaRequest): Observable<UeaCatalogItem> {
    return this.repository.registerUea(request);
  }

  bulkUploadUeas(file: File): Observable<UeaBulkUploadResult> {
    return this.repository.bulkUploadUeas(file);
  }
}
