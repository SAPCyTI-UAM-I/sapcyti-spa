import {
  AnnualPlanCell,
  AnnualPlanMark,
  AnnualPlanMarks,
  ProgramCode,
  SaveEntriesRequest,
} from '../../../models';

/** The 9 fixed DCBI program columns, in the order of the official format. */
export const PROGRAM_CODES: readonly ProgramCode[] = [
  'P_FIS',
  'P_MAT',
  'MCMAI',
  'P_QUIM',
  'P_IQUIM',
  'P_IBIOM',
  'PCYTI',
  'PEMA',
  'EFMC',
];

/**
 * Program marks the coordinator can edit. `PCYTI` is excluded: its obligatoria/optativa
 * mark is derived from the UEA catalog `tipo` and re-derived server-side, so it is never
 * part of the save payload (like clave/nombre/modalidad snapshots).
 */
export const EDITABLE_PROGRAM_CODES: readonly ProgramCode[] = PROGRAM_CODES.filter(
  (code) => code !== 'PCYTI',
);

/**
 * A group/quota cell is valid when empty (`null`/`""`), `"*"`, or a positive
 * integer written as digits. Mirrors the DB `CHECK` so inline validation matches
 * what the backend re-validates on save.
 */
export function isValidCell(value: string | null | undefined): boolean {
  if (value == null) {
    return true;
  }
  const v = value.trim();
  if (v === '' || v === '*') {
    return true;
  }
  return /^[0-9]+$/.test(v) && Number(v) > 0;
}

/** Click cycle for a program mark cell: empty → X → O → empty. */
export function cycleMark(current: AnnualPlanMark | undefined): AnnualPlanMark | undefined {
  switch (current) {
    case undefined:
      return 'X';
    case 'X':
      return 'O';
    case 'O':
      return undefined;
  }
}

/** The 6 editable group/quota cell fields, in grid column order. */
export const CELL_FIELDS = ['gruposI', 'cupoI', 'gruposP', 'cupoP', 'gruposO', 'cupoO'] as const;
export type CellField = (typeof CELL_FIELDS)[number];

/** Editable value of one grid row (clave/nombre/modalidad are read-only snapshots). */
export type AnnualPlanEntryFormValue = Record<CellField, string> & {
  id: number;
  marks: AnnualPlanMarks;
};

function normalizeCell(value: string): AnnualPlanCell {
  const v = value.trim();
  return v === '' ? null : v;
}

/**
 * Keeps only the editable program marks that are set. Empty/absent marks and the
 * catalog-derived `PCYTI` are dropped, so the payload carries just what the coordinator
 * can actually change.
 */
function cleanMarks(marks: AnnualPlanMarks): AnnualPlanMarks {
  const out: AnnualPlanMarks = {};
  for (const code of EDITABLE_PROGRAM_CODES) {
    const mark = marks[code];
    if (mark) {
      out[code] = mark;
    }
  }
  return out;
}

/** Builds the full-replacement save payload; never carries snapshot fields. */
export function buildSaveEntriesRequest(entries: AnnualPlanEntryFormValue[]): SaveEntriesRequest {
  return {
    entries: entries.map((entry) => {
      const cells = Object.fromEntries(
        CELL_FIELDS.map((field) => [field, normalizeCell(entry[field])]),
      ) as Record<CellField, AnnualPlanCell>;
      return { id: entry.id, ...cells, marks: cleanMarks(entry.marks) };
    }),
  };
}
