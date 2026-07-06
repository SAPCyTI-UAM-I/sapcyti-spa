import { Injectable } from '@angular/core';

import {
  PageResponse,
  RegisterUeaRequest,
  UeaCatalogItem,
  UeaCatalogQuery,
  UpdateUeaRequest,
} from '../../../models';
import { mockConflict, mockNotFound, nextId, normalizeSearch, page } from './catalog-mock.util';
import { UEA_CATALOG_SEED } from './uea-mock.seed';

@Injectable({ providedIn: 'root' })
export class UeaMockStore {
  // Fresh copy of the seed so each store instance owns its mutable state.
  private ueas: UeaCatalogItem[] = UEA_CATALOG_SEED.map((uea) => ({ ...uea }));

  listUeas(query: UeaCatalogQuery): PageResponse<UeaCatalogItem> {
    const search = normalizeSearch(query.search ?? '');
    let filtered = this.ueas.filter((uea) => {
      const matchesSearch =
        !search || normalizeSearch(`${uea.clave} ${uea.nombre}`).includes(search);
      return matchesSearch && (query.active === undefined || uea.active === query.active);
    });
    const [field, dir] = (query.sort ?? '').split(',');
    if (field === 'clave' || field === 'nombre') {
      const sign = dir === 'desc' ? -1 : 1;
      filtered = [...filtered].sort((a, b) => a[field].localeCompare(b[field], 'es') * sign);
    }
    return page(filtered, query.page, query.size);
  }

  createUea(request: RegisterUeaRequest): UeaCatalogItem {
    if (this.ueas.some((u) => u.clave.toLowerCase() === request.clave.toLowerCase())) {
      throw mockConflict('UEA_ALREADY_EXISTS');
    }
    const uea: UeaCatalogItem = {
      ...request,
      id: nextId(this.ueas),
      active: true,
    };
    this.ueas = [uea, ...this.ueas];
    return uea;
  }

  getUea(ueaId: number): UeaCatalogItem {
    return this.requireUea(ueaId);
  }

  updateUea(ueaId: number, request: UpdateUeaRequest): UeaCatalogItem {
    const uea = this.requireUea(ueaId);
    // clave/id/active are preserved; only the editable fields change (HU-47).
    Object.assign(uea, request);
    return uea;
  }

  deactivateUea(ueaId: number): UeaCatalogItem {
    const uea = this.requireUea(ueaId);
    if (!uea.active) {
      throw mockConflict('UEA_ALREADY_INACTIVE');
    }
    uea.active = false;
    return uea;
  }

  restoreUea(ueaId: number): UeaCatalogItem {
    const uea = this.requireUea(ueaId);
    if (uea.active) {
      throw mockConflict('UEA_ALREADY_ACTIVE');
    }
    uea.active = true;
    return uea;
  }

  private requireUea(ueaId: number): UeaCatalogItem {
    const uea = this.ueas.find((u) => u.id === ueaId);
    if (!uea) {
      throw mockNotFound('UEA_NOT_FOUND');
    }
    return uea;
  }

  getAllClaves(): string[] {
    return this.ueas.map((u) => u.clave);
  }

  insertBulk(items: Omit<UeaCatalogItem, 'id' | 'active'>[]): void {
    const base = nextId(this.ueas);
    const newUeas: UeaCatalogItem[] = items.map((item, i) => ({
      ...item,
      id: base + i,
      active: true,
    }));
    this.ueas = [...newUeas, ...this.ueas];
  }
}
