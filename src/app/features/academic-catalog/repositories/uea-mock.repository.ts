import { inject, Injectable } from '@angular/core';
import { from, Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  PageResponse,
  RegisterUeaRequest,
  UeaBulkUploadResult,
  UeaCatalogItem,
  UeaCatalogQuery,
  UpdateUeaRequest,
} from '../../../models';
import { fromMockStore } from '../../../core/mocks/from-mock-store.util';
import { mockApiError } from '../../../core/errors/testing/mock-api-error.util';
import { UeaMockStore } from '../mocks/uea-mock.store';
import { normalizeUeaRows, parseUeaCsv, validateUeaRows } from '../utils/uea-bulk.util';
import { UeaRepository } from './uea.repository';

@Injectable()
export class UeaMockRepository implements UeaRepository {
  private readonly mockStore = inject(UeaMockStore);

  listUeas(query: UeaCatalogQuery): Observable<PageResponse<UeaCatalogItem>> {
    return of(this.mockStore.listUeas(query));
  }

  registerUea(request: RegisterUeaRequest): Observable<UeaCatalogItem> {
    return fromMockStore(() => this.mockStore.createUea(request));
  }

  bulkUploadUeas(file: File): Observable<UeaBulkUploadResult> {
    const ext = (file.name.split('.').pop() ?? '').toLowerCase();

    if (ext !== 'csv' && ext !== 'xlsx') {
      return throwError(() => mockApiError({ status: 400, error: 'FILE_FORMAT_INVALID' }));
    }

    if (ext === 'xlsx') {
      // ponytail: stub — backend handles xlsx parsing in prod; mock returns simulated data
      return of({ created: 5, errors: [] });
    }

    return from(file.text()).pipe(
      map((text) => {
        const rows = parseUeaCsv(text);
        if (!rows) {
          throw mockApiError({ status: 400, error: 'FILE_FORMAT_INVALID' });
        }
        const existingClaves = new Set(this.mockStore.getAllClaves().map((c) => c.toLowerCase()));
        const result = validateUeaRows(rows, existingClaves);
        if (result.created > 0) {
          this.mockStore.insertBulk(normalizeUeaRows(rows));
        }
        return result;
      }),
    );
  }

  getUea(ueaId: number): Observable<UeaCatalogItem> {
    return fromMockStore(() => this.mockStore.getUea(ueaId));
  }

  updateUea(ueaId: number, request: UpdateUeaRequest): Observable<UeaCatalogItem> {
    return fromMockStore(() => this.mockStore.updateUea(ueaId, request));
  }

  deactivateUea(ueaId: number, confirm = false): Observable<UeaCatalogItem> {
    return fromMockStore(() => this.mockStore.deactivateUea(ueaId, confirm));
  }

  restoreUea(ueaId: number): Observable<UeaCatalogItem> {
    return fromMockStore(() => this.mockStore.restoreUea(ueaId));
  }
}
