import type { DocumentKind, DocumentType } from '../../../models';
import { documentFileNameAliases } from './exam-document-name.util';

/** Prefijo canónico de un PDF; no se usa File.type como autoridad. */
const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
const PDF_SAMPLE_SIZE = 8;

export type DocumentValidationCode =
  | 'INVALID_DOCUMENT_NAME'
  | 'INVALID_PDF_CONTENT'
  | 'INVALID_ARTICLE_URL'
  | 'SINGLE_FILE_ONLY'
  | 'EXPECTED_NAME_UNAVAILABLE'
  | 'DOCUMENT_KIND_NOT_ALLOWED';

export type DocumentValidationResult =
  | { ok: true }
  | { ok: false; code: DocumentValidationCode; expectedName?: string };

export interface ValidatePendingDocumentInput {
  readonly files?: readonly File[];
  readonly url?: string | null;
  readonly documentType: DocumentType;
  readonly expectedName: string | null;
  readonly acceptedKinds: readonly DocumentKind[];
  readonly kind: DocumentKind;
}

/** Compara ignorando caja, .pdf y el prefijo es/en; no normaliza acentos. */
export function matchesExpectedDocumentName(fileName: string, expectedName: string): boolean {
  const fileNorm = normalizeComparableName(fileName);
  return documentFileNameAliases(expectedName).some(
    (alias) => normalizeComparableName(alias) === fileNorm,
  );
}

/** La muestra es PDF solo si empieza con %PDF. */
export function hasPdfMagicBytes(sample: Uint8Array): boolean {
  if (sample.length < PDF_MAGIC.length) {
    return false;
  }

  return PDF_MAGIC.every((byte, index) => sample[index] === byte);
}

/** Lee un prefijo ligero; File.type no interviene. */
export async function readPdfSample(file: File): Promise<Uint8Array> {
  const buffer = await file.slice(0, PDF_SAMPLE_SIZE).arrayBuffer();
  return new Uint8Array(buffer);
}

/** URL absoluta estricta con esquema https:// (minúsculas). */
export function isHttpsArticleUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.startsWith('https://')) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

/**
 * Valida la selección local pendiente. No impone tope de tamaño:
 * un PDF grande es aceptable si nombre y magic bytes cumplen.
 */
export async function validatePendingDocument(
  input: ValidatePendingDocumentInput,
): Promise<DocumentValidationResult> {
  if (!input.acceptedKinds.includes(input.kind)) {
    return { ok: false, code: 'DOCUMENT_KIND_NOT_ALLOWED' };
  }

  if (input.kind === 'URL') {
    return validateArticleUrl(input);
  }

  return validatePdfSelection(input);
}

function validateArticleUrl(input: ValidatePendingDocumentInput): DocumentValidationResult {
  if (input.documentType !== 'ARTICULO') {
    return { ok: false, code: 'DOCUMENT_KIND_NOT_ALLOWED' };
  }

  const files = input.files ?? [];
  if (files.length > 1) {
    return { ok: false, code: 'SINGLE_FILE_ONLY' };
  }

  if (!isHttpsArticleUrl(input.url ?? '')) {
    return { ok: false, code: 'INVALID_ARTICLE_URL' };
  }

  return { ok: true };
}

async function validatePdfSelection(
  input: ValidatePendingDocumentInput,
): Promise<DocumentValidationResult> {
  const files = input.files ?? [];
  if (files.length > 1) {
    return { ok: false, code: 'SINGLE_FILE_ONLY' };
  }

  const [file] = files;
  if (!file) {
    return { ok: false, code: 'INVALID_PDF_CONTENT' };
  }

  const sample = await readPdfSample(file);
  if (!hasPdfMagicBytes(sample)) {
    return { ok: false, code: 'INVALID_PDF_CONTENT' };
  }

  if (input.documentType === 'ARTICULO') {
    return { ok: true };
  }

  if (!input.expectedName) {
    return { ok: false, code: 'EXPECTED_NAME_UNAVAILABLE' };
  }

  if (!matchesExpectedDocumentName(file.name, input.expectedName)) {
    return { ok: false, code: 'INVALID_DOCUMENT_NAME', expectedName: input.expectedName };
  }

  return { ok: true };
}

function normalizeComparableName(value: string): string {
  return stripPdfExtension(fileBasename(value)).toLowerCase();
}

function stripPdfExtension(name: string): string {
  return name.replace(/\.pdf$/i, '');
}

function fileBasename(path: string): string {
  const normalized = path.replaceAll('\\', '/');
  const separator = normalized.lastIndexOf('/');
  return separator === -1 ? normalized : normalized.slice(separator + 1);
}
