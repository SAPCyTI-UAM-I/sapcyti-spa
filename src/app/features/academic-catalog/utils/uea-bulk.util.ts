import {
  BulkErrorCode,
  UeaBulkUploadResult,
  UeaCatalogItem,
  UeaTipoFormacion,
  UeaTipo,
} from '../../../models';

export const UEA_BULK_REQUIRED_HEADERS = [
  'Clave',
  'NOMBRE UEA',
  'TIPO',
  'MODALIDAD',
  'H. TEOR.',
  'H. PRAC.',
  'Tipo formacion',
  'Creditos',
] as const;

/** Raw column values parsed from a CSV data row (all strings). */
export interface UeaBulkRawRow {
  clave: string;
  nombre: string;
  tipo: string;
  modalidad: string;
  horasTeoria: string;
  horasPractica: string;
  tipoFormacion: string;
  creditos: string;
}

const TIPO_NORMALIZE: Record<string, UeaTipo> = {
  OBLIGATORIA: 'OBLIGATORIA',
  OPTATIVA: 'OPTATIVA',
};

const TIPO_FORMACION_NORMALIZE: Record<string, UeaTipoFormacion> = {
  BASICA: 'BASICA',
  COMPLEMENTARIA: 'COMPLEMENTARIA',
  INVESTIGACION: 'INVESTIGACION',
};

function parseCsvLine(line: string): string[] {
  // ponytail: simple split — template values don't contain commas
  return line.split(',').map((c) => c.trim());
}

/** Parses CSV text. Returns `null` if headers don't match the template. */
export function parseUeaCsv(text: string): UeaBulkRawRow[] | null {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 1) return null;

  const headers = parseCsvLine(lines[0]!);
  const expected = UEA_BULK_REQUIRED_HEADERS as readonly string[];
  if (!expected.every((h, i) => headers[i] === h)) return null;

  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const cols = parseCsvLine(line);
      return {
        clave: cols[0] ?? '',
        nombre: cols[1] ?? '',
        tipo: cols[2] ?? '',
        modalidad: cols[3] ?? '',
        horasTeoria: cols[4] ?? '',
        horasPractica: cols[5] ?? '',
        tipoFormacion: cols[6] ?? '',
        creditos: cols[7] ?? '',
      };
    });
}

/**
 * Validates rows for atomicity and returns the upload result.
 * If any error → `created: 0`. Otherwise `created = rows.length`.
 */
export function validateUeaRows(
  rows: UeaBulkRawRow[],
  existingClaves: ReadonlySet<string>,
): UeaBulkUploadResult {
  const errors: { row: number; code: BulkErrorCode }[] = [];
  const seenClaves = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const rowNum = i + 2; // row 1 = header

    const tipo = TIPO_NORMALIZE[row.tipo.toUpperCase()];
    const tipoFormacion = TIPO_FORMACION_NORMALIZE[row.tipoFormacion.trim().toUpperCase()];

    if (!row.clave || !row.nombre || !tipo || !tipoFormacion) {
      errors.push({ row: rowNum, code: 'MISSING_FIELD' });
      continue;
    }

    const creditos = Number(row.creditos);
    if (!Number.isInteger(creditos) || creditos <= 0) {
      errors.push({ row: rowNum, code: 'INVALID_CREDITS' });
      continue;
    }

    const claveLower = row.clave.toLowerCase();
    if (existingClaves.has(claveLower) || seenClaves.has(claveLower)) {
      errors.push({ row: rowNum, code: 'DUPLICATE_CLAVE' });
      continue;
    }

    seenClaves.add(claveLower);
  }

  return { created: errors.length === 0 ? rows.length : 0, errors };
}

/** Converts validated raw rows into UeaCatalogItem shape (without id/active). */
export function normalizeUeaRows(rows: UeaBulkRawRow[]): Omit<UeaCatalogItem, 'id' | 'active'>[] {
  return rows.map((row) => ({
    clave: row.clave,
    nombre: row.nombre,
    tipo: TIPO_NORMALIZE[row.tipo.toUpperCase()] as UeaTipo,
    modalidad: 'MIXTA',
    horasTeoria: Number(row.horasTeoria),
    horasPractica: Number(row.horasPractica),
    tipoFormacion: TIPO_FORMACION_NORMALIZE[
      row.tipoFormacion.trim().toUpperCase()
    ] as UeaTipoFormacion,
    creditos: Number(row.creditos),
  }));
}
