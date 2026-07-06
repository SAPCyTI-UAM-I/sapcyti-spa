import { Injectable } from '@angular/core';

import { mockApiError } from '../../../core/errors/testing/mock-api-error.util';
import {
  AnnualPlanDetail,
  AnnualPlanEntry,
  AnnualPlanSummary,
  ChangeStatusRequest,
  CreateAnnualPlanRequest,
  FormatCheckReport,
  SaveEntriesRequest,
} from '../../../models';
import { UEA_CATALOG_SEED } from '../../../shared/mocks/uea-catalog.mock-data';
import { isAdjacent } from '../utils/annual-plan-status.util';
import { isValidCell } from '../utils/annual-plan-cell.util';

/**
 * Active UEAs from the shared catalog seed. The real backend derives a plan's rows from the
 * live UEA catalog (modalidad + tipo -> PCyTI mark); the mock reads the same seed so the
 * wiring is identical when the real endpoints land.
 */
const SEED_CATALOG = UEA_CATALOG_SEED.filter((uea) => uea.active).map((uea) => ({
  ueaId: uea.id,
  clave: uea.clave,
  nombre: uea.nombre,
  modalidad: uea.modalidad,
  tipo: uea.tipo,
}));

function termsForYear(year: number): [string, string, string] {
  const yy = String(year).slice(-2);
  return [`${yy}-I`, `${yy}-P`, `${yy}-O`];
}

function emptyEntry(id: number, seed: (typeof SEED_CATALOG)[number]): AnnualPlanEntry {
  return {
    id,
    ueaId: seed.ueaId,
    clave: seed.clave,
    nombre: seed.nombre,
    modalidad: seed.modalidad,
    gruposI: null,
    cupoI: null,
    gruposP: null,
    cupoP: null,
    gruposO: null,
    cupoO: null,
    // PCyTI mark seeded from the catalog `tipo`: OBLIGATORIA → X, OPTATIVA → O.
    marks: { PCYTI: seed.tipo === 'OBLIGATORIA' ? 'X' : 'O' },
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

/**
 * In-memory mock backing the Annual Planning screens. Replicates the API contract:
 * canonical statuses, snapshot entries, adjacency rules and `{ error, message }`
 * HttpErrorResponse payloads. Seeds a 2027 draft and a 2026 completed plan.
 */
@Injectable({ providedIn: 'root' })
export class AnnualPlanMockStore {
  private plans: AnnualPlanDetail[] = [seedDraft2027(), seedCompleted2026()];
  private nextEntryId = 1000;

  list(): AnnualPlanSummary[] {
    return this.plans
      .map((plan) => ({ year: plan.year, status: plan.status }))
      .sort((a, b) => b.year - a.year);
  }

  get(year: number): AnnualPlanDetail {
    return clone(this.requirePlan(year));
  }

  check(file: File): FormatCheckReport {
    const ext = (file.name.split('.').pop() ?? '').toLowerCase();
    if (ext !== 'xlsx') {
      throw mockApiError({
        status: 400,
        error: 'FILE_FORMAT_INVALID',
        message: 'El archivo debe ser .xlsx',
      });
    }
    // ponytail: mock devuelve un reporte de muestra con diferencias para ejercitar
    // el diálogo de comparación; el backend real compara contra el catálogo activo.
    return {
      missingInCatalog: [{ clave: '2156099', nombre: 'Tópicos selectos (baja)' }],
      missingInFile: [{ clave: '2159007', nombre: 'Investigación Doctoral I' }],
      nameMismatches: [
        {
          clave: '2156053',
          nombreCatalogo: 'Ingeniería de software I',
          nombreArchivo: 'Ing. de Software I',
        },
      ],
      unknownPrograms: [],
      missingPrograms: [],
    };
  }

  create(request: CreateAnnualPlanRequest): AnnualPlanDetail {
    if (this.plans.some((plan) => plan.year === request.year)) {
      throw mockApiError({
        status: 409,
        error: 'ANNUAL_PLAN_ALREADY_EXISTS',
        message: `Ya existe una planeación para ${request.year}`,
      });
    }

    const previous = this.plans.find((plan) => plan.year === request.year - 1);
    const entries = SEED_CATALOG.map((seed) => {
      const entry = emptyEntry(this.nextEntryId++, seed);
      const prior = previous?.entries.find((e) => e.ueaId === seed.ueaId);
      if (prior) {
        // Preload group/quota/marks from the immediately previous year's plan.
        Object.assign(entry, {
          gruposI: prior.gruposI,
          cupoI: prior.cupoI,
          gruposP: prior.gruposP,
          cupoP: prior.cupoP,
          gruposO: prior.gruposO,
          cupoO: prior.cupoO,
          marks: { ...prior.marks },
        });
      }
      return entry;
    });

    const plan: AnnualPlanDetail = {
      year: request.year,
      status: 'BORRADOR',
      terms: termsForYear(request.year),
      entries,
    };
    this.plans.push(plan);
    return clone(plan);
  }

  saveEntries(year: number, request: SaveEntriesRequest): AnnualPlanDetail {
    const plan = this.requirePlan(year);
    if (plan.status !== 'BORRADOR') {
      throw mockApiError({
        status: 409,
        error: 'PLAN_NOT_EDITABLE',
        message: 'Solo se puede editar una planeación en Borrador.',
      });
    }

    const invalid: string[] = [];
    for (const entry of request.entries) {
      if (!plan.entries.some((e) => e.id === entry.id)) {
        throw mockApiError({ status: 404, message: `Entry ${entry.id} no pertenece al plan` });
      }
      const cells = [
        entry.gruposI,
        entry.cupoI,
        entry.gruposP,
        entry.cupoP,
        entry.gruposO,
        entry.cupoO,
      ];
      if (cells.some((cell) => !isValidCell(cell))) {
        invalid.push(String(entry.id));
      }
    }
    if (invalid.length > 0) {
      throw mockApiError({
        status: 400,
        error: 'VALIDATION_ERROR',
        message: `Celdas inválidas en: ${invalid.join(', ')}`,
      });
    }

    for (const update of request.entries) {
      const entry = plan.entries.find((e) => e.id === update.id)!;
      // modalidad/clave/nombre are catalog snapshots — never overwritten on save.
      Object.assign(entry, {
        gruposI: update.gruposI,
        cupoI: update.cupoI,
        gruposP: update.gruposP,
        cupoP: update.cupoP,
        gruposO: update.gruposO,
        cupoO: update.cupoO,
        marks: { ...update.marks },
      });
    }
    return clone(plan);
  }

  changeStatus(year: number, request: ChangeStatusRequest): AnnualPlanSummary {
    const plan = this.requirePlan(year);
    if (!isAdjacent(plan.status, request.status)) {
      throw mockApiError({
        status: 409,
        error: 'INVALID_STATUS_TRANSITION',
        message: `Transición ${plan.status} → ${request.status} no permitida`,
      });
    }
    plan.status = request.status;
    return { year: plan.year, status: plan.status };
  }

  export(year: number): Blob {
    this.requirePlan(year);
    // ponytail: el mock no arma un xlsx real; el backend genera el .xlsx (HU-52).
    // Devuelve un placeholder para que la descarga sea funcional contra la API real.
    return new Blob([`Planeacion PCyTI ${year} (mock stub)`], { type: 'text/plain' });
  }

  private requirePlan(year: number): AnnualPlanDetail {
    const plan = this.plans.find((p) => p.year === year);
    if (!plan) {
      throw mockApiError({ status: 404, message: `No existe planeación para ${year}` });
    }
    return plan;
  }
}

function seedDraft2027(): AnnualPlanDetail {
  const entries = SEED_CATALOG.map((seed, index) => emptyEntry(index + 1, seed));
  // A couple of rows preloaded so the grid isn't blank on first open.
  Object.assign(entries[0]!, { gruposI: '1', cupoI: '15', marks: { PCYTI: 'X', P_FIS: 'O' } });
  Object.assign(entries[1]!, { gruposO: '2', cupoO: '*', marks: { PCYTI: 'O' } });
  return { year: 2027, status: 'BORRADOR', terms: termsForYear(2027), entries };
}

function seedCompleted2026(): AnnualPlanDetail {
  const entries = SEED_CATALOG.map((seed, index) => {
    const entry = emptyEntry(index + 101, seed);
    Object.assign(entry, { gruposI: '1', cupoI: '15', marks: { PCYTI: 'X' } });
    return entry;
  });
  return { year: 2026, status: 'TERMINADA', terms: termsForYear(2026), entries };
}
