import {
  parseUeaCsv,
  UeaBulkRawRow,
  UEA_BULK_REQUIRED_HEADERS,
  validateUeaRows,
} from './uea-bulk.util';

const HEADER = UEA_BULK_REQUIRED_HEADERS.join(',');
const VALID_ROW = '2156024,REDES Y PROTOCOLOS,OBLIGATORIA,MIXTA,3,3,Basica,9';
const VALID_CSV = `${HEADER}\n${VALID_ROW}`;

function makeRow(overrides: Partial<UeaBulkRawRow> = {}): UeaBulkRawRow {
  return {
    clave: '9999',
    nombre: 'UEA TEST',
    tipo: 'OBLIGATORIA',
    modalidad: 'MIXTA',
    horasTeoria: '3',
    horasPractica: '3',
    tipoFormacion: 'Basica',
    creditos: '9',
    ...overrides,
  };
}

describe('parseUeaCsv', () => {
  it('returns rows for a valid CSV', () => {
    const rows = parseUeaCsv(VALID_CSV);
    expect(rows).toHaveLength(1);
    expect(rows![0]!.clave).toBe('2156024');
    expect(rows![0]!.nombre).toBe('REDES Y PROTOCOLOS');
  });

  it('returns null for wrong headers', () => {
    expect(parseUeaCsv('Clave,WRONG\n1234,x')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(parseUeaCsv('')).toBeNull();
  });

  it('returns empty array for header-only (valid template)', () => {
    expect(parseUeaCsv(HEADER)).toEqual([]);
  });

  it('skips blank lines', () => {
    const csv = `${HEADER}\n${VALID_ROW}\n\n`;
    expect(parseUeaCsv(csv)).toHaveLength(1);
  });
});

describe('validateUeaRows', () => {
  it('returns created count for valid rows with no conflicts', () => {
    const result = validateUeaRows([makeRow()], new Set());
    expect(result.created).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('detects MISSING_FIELD when nombre is empty', () => {
    const result = validateUeaRows([makeRow({ nombre: '' })], new Set());
    expect(result.errors[0]).toEqual({ row: 2, code: 'MISSING_FIELD' });
    expect(result.created).toBe(0);
  });

  it('detects MISSING_FIELD when tipo is invalid', () => {
    const result = validateUeaRows([makeRow({ tipo: 'INVALIDO' })], new Set());
    expect(result.errors[0]!.code).toBe('MISSING_FIELD');
  });

  it('detects INVALID_CREDITS for creditos = 0', () => {
    const result = validateUeaRows([makeRow({ creditos: '0' })], new Set());
    expect(result.errors[0]!.code).toBe('INVALID_CREDITS');
  });

  it('detects INVALID_CREDITS for decimal creditos', () => {
    const result = validateUeaRows([makeRow({ creditos: '4.5' })], new Set());
    expect(result.errors[0]!.code).toBe('INVALID_CREDITS');
  });

  it('detects DUPLICATE_CLAVE against existing set (case-insensitive)', () => {
    const result = validateUeaRows([makeRow({ clave: 'EXIST' })], new Set(['exist']));
    expect(result.errors[0]!.code).toBe('DUPLICATE_CLAVE');
  });

  it('detects DUPLICATE_CLAVE within the file itself', () => {
    const result = validateUeaRows(
      [makeRow({ clave: 'ABC' }), makeRow({ clave: 'ABC' })],
      new Set(),
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({ row: 3, code: 'DUPLICATE_CLAVE' });
  });

  it('is atomic: created=0 when any row has error', () => {
    const result = validateUeaRows([makeRow(), makeRow({ nombre: '' })], new Set());
    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(1);
  });

  it('normalizes TitleCase tipoFormacion (Basica → BASICA)', () => {
    const result = validateUeaRows([makeRow({ tipoFormacion: 'Complementaria' })], new Set());
    expect(result.errors).toHaveLength(0);
    expect(result.created).toBe(1);
  });

  it('normalizes uppercase TIPO (obligatoria → OBLIGATORIA)', () => {
    const result = validateUeaRows([makeRow({ tipo: 'optativa' })], new Set());
    expect(result.errors).toHaveLength(0);
  });

  it('reports correct row numbers (header is row 1)', () => {
    const result = validateUeaRows(
      [makeRow(), makeRow({ nombre: '' }), makeRow({ clave: 'DUP' }), makeRow({ clave: 'DUP' })],
      new Set(),
    );
    const rows = result.errors.map((e) => e.row);
    expect(rows).toContain(3); // second data row, nombre empty
    expect(rows).toContain(5); // fourth data row, duplicate
  });
});
