/**
 * Annual Planning domain types (HU-49–53), mirror of the API contract in
 * `Docs/sdd/specs/design-notes/2026-07-01/planeacion-anual-api-spec.md`.
 *
 * Codes are canonical: the API/DB never send translated text; the SPA translates
 * `status` and the legend for display. Cell values (`*`, program marks) are the
 * official format notation, identical in every language.
 */

export type AnnualPlanStatus = 'BORRADOR' | 'TERMINADA' | 'ARCHIVADA';

/** The 9 fixed DCBI graduate programs that make up the mark columns. */
export type ProgramCode =
  | 'P_FIS'
  | 'P_MAT'
  | 'MCMAI'
  | 'P_QUIM'
  | 'P_IQUIM'
  | 'P_IBIOM'
  | 'PCYTI'
  | 'PEMA'
  | 'EFMC';

/** Program mark for an entry; an absent key means an empty cell (no combined X/O). */
export type AnnualPlanMark = 'X' | 'O';

export type AnnualPlanMarks = Partial<Record<ProgramCode, AnnualPlanMark>>;

/** A group/quota cell: a positive integer as string, `"*"`, or `null` (empty). */
export type AnnualPlanCell = string | null;

/** Summary row for the plan list (HU-50). */
export interface AnnualPlanSummary {
  year: number;
  status: AnnualPlanStatus;
}

/** A single UEA row of a plan. `clave`/`nombre` are read-only snapshots; the rest is editable. */
export interface AnnualPlanEntry {
  id: number;
  ueaId: number;
  clave: string; // snapshot, read-only
  nombre: string; // snapshot, read-only
  modalidad: string; // snapshot from the UEA catalog, read-only
  gruposI: AnnualPlanCell;
  cupoI: AnnualPlanCell;
  gruposP: AnnualPlanCell;
  cupoP: AnnualPlanCell;
  gruposO: AnnualPlanCell;
  cupoO: AnnualPlanCell;
  marks: AnnualPlanMarks;
}

/** Full plan with its entries (HU-50). */
export interface AnnualPlanDetail {
  year: number;
  status: AnnualPlanStatus;
  /** Trimester labels derived from the year, e.g. ["27-I", "27-P", "27-O"]. */
  terms: [string, string, string];
  entries: AnnualPlanEntry[]; // ordered by posicion
}

/** Difference between the uploaded file and the active catalog (HU-49). */
export interface FormatCheckReport {
  missingInCatalog: { clave: string; nombre: string }[];
  missingInFile: { clave: string; nombre: string }[];
  nameMismatches: { clave: string; nombreCatalogo: string; nombreArchivo: string }[];
  unknownPrograms: string[];
  missingPrograms: string[];
}

export interface CreateAnnualPlanRequest {
  year: number;
}

/** A single entry payload for the full-replacement save (HU-51). `clave`/`nombre`/`modalidad` stay read-only. */
export interface SaveEntryRequest {
  id: number;
  gruposI: AnnualPlanCell;
  cupoI: AnnualPlanCell;
  gruposP: AnnualPlanCell;
  cupoP: AnnualPlanCell;
  gruposO: AnnualPlanCell;
  cupoO: AnnualPlanCell;
  marks: AnnualPlanMarks;
}

export interface SaveEntriesRequest {
  entries: SaveEntryRequest[];
}

export interface ChangeStatusRequest {
  status: AnnualPlanStatus;
}
