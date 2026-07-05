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
    try {
      return of(this.mockStore.createUea(request));
    } catch (error) {
      return throwError(() => error);
    }
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
    try {
      return of(this.mockStore.getUea(ueaId));
    } catch (error) {
      return throwError(() => error);
    }
  }

  updateUea(ueaId: number, request: UpdateUeaRequest): Observable<UeaCatalogItem> {
    try {
      return of(this.mockStore.updateUea(ueaId, request));
    } catch (error) {
      return throwError(() => error);
    }
  }

  deactivateUea(ueaId: number): Observable<UeaCatalogItem> {
    try {
      return of(this.mockStore.deactivateUea(ueaId));
    } catch (error) {
      return throwError(() => error);
    }
  }

  restoreUea(ueaId: number): Observable<UeaCatalogItem> {
    try {
      return of(this.mockStore.restoreUea(ueaId));
    } catch (error) {
      return throwError(() => error);
    }
  }
}
