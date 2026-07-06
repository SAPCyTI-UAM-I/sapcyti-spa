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
import { isAdjacent } from '../utils/annual-plan-status.util';
import { isValidCell } from '../utils/annual-plan-cell.util';

/** Active UEA catalog used to generate plan entries (mock only; the backend reads the real catalog). */
const SEED_CATALOG: { ueaId: number; clave: string; nombre: string; modalidad: string }[] = [
  {
    ueaId: 1,
    clave: '2156024',
    nombre: 'REDES Y PROTOCOLOS DE COMUNICACIONES',
    modalidad: 'PRESENCIAL',
  },
  { ueaId: 2, clave: '2156027', nombre: 'INTELIGENCIA ARTIFICIAL', modalidad: 'MIXTA' },
  {
    ueaId: 3,
    clave: '2156028',
    nombre: 'SEMINARIO DE CIENCIAS Y TECNOLOGÍAS DE LA INFORMACIÓN',
    modalidad: 'VIRTUAL',
  },
  { ueaId: 4, clave: '2156033', nombre: 'EVALUACIÓN DE DESEMPEÑO', modalidad: 'PRESENCIAL' },
  { ueaId: 5, clave: '2156038', nombre: 'ALGORITMOS DISTRIBUIDOS', modalidad: 'MIXTA' },
  { ueaId: 6, clave: '2156040', nombre: 'VERIFICACIÓN DE PROGRAMAS', modalidad: 'VIRTUAL' },
  {
    ueaId: 7,
    clave: '2156041',
    nombre: 'MÉTODOS MATEMÁTICOS PARA LA INTELIGENCIA ARTIFICIAL',
    modalidad: 'PRESENCIAL',
  },
  {
    ueaId: 8,
    clave: '2156043',
    nombre: 'TEMAS SELECTOS DE CIENCIAS Y TECNOLOGÍAS I',
    modalidad: 'MIXTA',
  },
  {
    ueaId: 9,
    clave: '2156044',
    nombre: 'TEMAS SELECTOS DE CIENCIAS Y TECNOLOGÍAS II',
    modalidad: 'VIRTUAL',
  },
  {
    ueaId: 10,
    clave: '2156045',
    nombre: 'TEMAS SELECTOS DE CIENCIAS Y TECNOLOGÍAS III',
    modalidad: 'PRESENCIAL',
  },
  { ueaId: 11, clave: '2156047', nombre: 'PROYECTO DE INVESTIGACIÓN II', modalidad: 'MIXTA' },
  { ueaId: 12, clave: '2156049', nombre: 'PROYECTO DE INVESTIGACIÓN I', modalidad: 'VIRTUAL' },
  { ueaId: 13, clave: '2156050', nombre: 'PROYECTO DE INVESTIGACIÓN III', modalidad: 'PRESENCIAL' },
  { ueaId: 14, clave: '2156051', nombre: 'ADMINISTRACIÓN DE PROYECTOS', modalidad: 'MIXTA' },
  { ueaId: 15, clave: '2156052', nombre: 'PROGRAMACIÓN CONCURRENTE', modalidad: 'VIRTUAL' },
  { ueaId: 16, clave: '2156053', nombre: 'INGENIERÍA DE SOFTWARE I', modalidad: 'PRESENCIAL' },
  { ueaId: 17, clave: '2156054', nombre: 'INGENIERÍA DE SOFTWARE II', modalidad: 'MIXTA' },
  { ueaId: 18, clave: '2156055', nombre: 'MODELOS DE REFERENCIA', modalidad: 'VIRTUAL' },
  { ueaId: 19, clave: '2156056', nombre: 'COMUNICACIONES INALÁMBRICAS', modalidad: 'PRESENCIAL' },
  { ueaId: 20, clave: '2156057', nombre: 'CÓMPUTO PARALELO', modalidad: 'MIXTA' },
  { ueaId: 21, clave: '2156058', nombre: 'INTELIGENCIA ARTIFICIAL APLICADA', modalidad: 'VIRTUAL' },
  { ueaId: 22, clave: '2156059', nombre: 'INTELIGENCIA COMPUTACIONAL', modalidad: 'PRESENCIAL' },
  {
    ueaId: 23,
    clave: '2156072',
    nombre: 'PROCESAMIENTO DE SEÑALES Y APRENDIZAJE AUTOMÁTICO',
    modalidad: 'MIXTA',
  },
  {
    ueaId: 24,
    clave: '2156073',
    nombre: 'FUNDAMENTOS DE SISTEMAS DE COMUNICACIONES DIGITALES',
    modalidad: 'VIRTUAL',
  },
  { ueaId: 25, clave: '2156074', nombre: 'ARQUITECTURA DE SOFTWARE', modalidad: 'PRESENCIAL' },
  { ueaId: 26, clave: '2156075', nombre: 'SERVICIOS DISTRIBUIDOS BÁSICOS', modalidad: 'MIXTA' },
  { ueaId: 27, clave: '2159007', nombre: 'INVESTIGACIÓN DOCTORAL I', modalidad: 'VIRTUAL' },
  { ueaId: 28, clave: '2159008', nombre: 'INVESTIGACIÓN DOCTORAL II', modalidad: 'PRESENCIAL' },
  { ueaId: 29, clave: '2159009', nombre: 'INVESTIGACIÓN DOCTORAL III', modalidad: 'MIXTA' },
  {
    ueaId: 30,
    clave: '2159010',
    nombre: 'SEMINARIO DE INVESTIGACIÓN DOCTORAL I',
    modalidad: 'VIRTUAL',
  },
  { ueaId: 31, clave: '2159011', nombre: 'INVESTIGACIÓN DOCTORAL IV', modalidad: 'PRESENCIAL' },
  { ueaId: 32, clave: '2159012', nombre: 'INVESTIGACIÓN DOCTORAL V', modalidad: 'MIXTA' },
  { ueaId: 33, clave: '2159013', nombre: 'INVESTIGACIÓN DOCTORAL VI', modalidad: 'VIRTUAL' },
  {
    ueaId: 34,
    clave: '2159014',
    nombre: 'SEMINARIO DE INVESTIGACIÓN DOCTORAL II',
    modalidad: 'PRESENCIAL',
  },
  { ueaId: 35, clave: '2159015', nombre: 'INVESTIGACIÓN DOCTORAL VII', modalidad: 'MIXTA' },
];

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
    marks: {},
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
      Object.assign(entry, {
        modalidad: update.modalidad,
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
