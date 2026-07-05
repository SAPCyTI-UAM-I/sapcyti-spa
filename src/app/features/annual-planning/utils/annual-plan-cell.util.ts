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

/** Click cycle for a program mark cell: empty → X → O → X/O → empty. */
export function cycleMark(current: AnnualPlanMark | undefined): AnnualPlanMark | undefined {
  switch (current) {
    case undefined:
      return 'X';
    case 'X':
      return 'O';
    case 'O':
      return 'X/O';
    case 'X/O':
      return undefined;
  }
}

/** Editable value of one grid row (snapshot fields live outside the form). */
export interface AnnualPlanEntryFormValue {
  id: number;
  gruposI: string;
  cupoI: string;
  gruposP: string;
  cupoP: string;
  gruposO: string;
  cupoO: string;
  marks: AnnualPlanMarks;
}

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
    entries: entries.map((entry) => ({
      id: entry.id,
      gruposI: normalizeCell(entry.gruposI),
      cupoI: normalizeCell(entry.cupoI),
      gruposP: normalizeCell(entry.gruposP),
      cupoP: normalizeCell(entry.cupoP),
      gruposO: normalizeCell(entry.gruposO),
      cupoO: normalizeCell(entry.cupoO),
      marks: cleanMarks(entry.marks),
    })),
  };
}
