import { I18nSelectOption } from '../../../shared/components';
import {
  AnnualPlanCell,
  AnnualPlanMark,
  AnnualPlanMarks,
  ProgramCode,
  SaveEntriesRequest,
} from '../../../models';

/** Modalidad options for the editable per-row select (HU-51). */
export const MODALIDAD_OPTIONS: I18nSelectOption<string>[] = [
  { labelKey: 'ANNUAL_PLANNING.MODALITY.PRESENCIAL', value: 'PRESENCIAL' },
  { labelKey: 'ANNUAL_PLANNING.MODALITY.MIXTA', value: 'MIXTA' },
  { labelKey: 'ANNUAL_PLANNING.MODALITY.VIRTUAL', value: 'VIRTUAL' },
];

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

/** Editable value of one grid row (clave/nombre live outside the form). */
export type AnnualPlanEntryFormValue = Record<CellField, string> & {
  id: number;
  modalidad: string;
  marks: AnnualPlanMarks;
};

function normalizeCell(value: string): AnnualPlanCell {
  const v = value.trim();
  return v === '' ? null : v;
}

/** Drops empty/absent marks so the payload only carries set program codes. */
function cleanMarks(marks: AnnualPlanMarks): AnnualPlanMarks {
  const out: AnnualPlanMarks = {};
  for (const code of PROGRAM_CODES) {
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
      return { id: entry.id, modalidad: entry.modalidad, ...cells, marks: cleanMarks(entry.marks) };
    }),
  };
}
