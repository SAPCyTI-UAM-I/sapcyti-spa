export type DocumentNameLanguage = 'es' | 'en';

/**
 * Prefijos de filename. El API entrega la forma en español;
 * el inglés solo se usa para mostrar y para aceptar el alias local.
 */
export const DOCUMENT_FILE_PREFIXES = [
  { es: 'Sol_Sinodales', en: 'Faculty_Committee' },
  { es: 'Comp_Idioma', en: 'Language_Certificate' },
  { es: 'Datos_Alum', en: 'Student_Data' },
  { es: 'Hist_Acad', en: 'Academic_Record' },
  { es: 'Tesis', en: 'Thesis' },
] as const;

/** Reescribe el prefijo documental según el idioma activo. */
export function localizeDocumentFileName(
  fileName: string | null,
  lang: DocumentNameLanguage,
): string | null {
  if (!fileName) {
    return fileName;
  }

  const parsed = parseDocumentFileName(fileName);
  if (!parsed) {
    return fileName;
  }

  const prefix = lang === 'en' ? parsed.en : parsed.es;
  return `${prefix}${parsed.rest}${parsed.extension}`;
}

/** Variantes es/en del mismo nombre canónico; sirve para no romper la validación. */
export function documentFileNameAliases(fileName: string): string[] {
  const parsed = parseDocumentFileName(fileName);
  if (!parsed) {
    return [fileBasename(fileName)];
  }

  return [
    `${parsed.es}${parsed.rest}${parsed.extension}`,
    `${parsed.en}${parsed.rest}${parsed.extension}`,
  ];
}

export function resolveDocumentNameLanguage(lang: string | null | undefined): DocumentNameLanguage {
  return lang === 'en' ? 'en' : 'es';
}

function parseDocumentFileName(fileName: string): {
  readonly es: string;
  readonly en: string;
  readonly rest: string;
  readonly extension: string;
} | null {
  const baseName = fileBasename(fileName);
  const extension = /\.pdf$/i.test(baseName) ? baseName.slice(baseName.lastIndexOf('.')) : '';
  const stem = extension ? baseName.slice(0, -extension.length) : baseName;
  const lower = stem.toLowerCase();

  const prefixes = [...DOCUMENT_FILE_PREFIXES].sort(
    (left, right) =>
      Math.max(right.es.length, right.en.length) - Math.max(left.es.length, left.en.length),
  );

  for (const prefix of prefixes) {
    const esPrefix = prefix.es.toLowerCase();
    const enPrefix = prefix.en.toLowerCase();
    if (lower === esPrefix || lower.startsWith(`${esPrefix}_`)) {
      return { es: prefix.es, en: prefix.en, rest: stem.slice(prefix.es.length), extension };
    }

    if (lower === enPrefix || lower.startsWith(`${enPrefix}_`)) {
      return { es: prefix.es, en: prefix.en, rest: stem.slice(prefix.en.length), extension };
    }
  }

  return null;
}

function fileBasename(path: string): string {
  const normalized = path.replaceAll('\\', '/');
  const separator = normalized.lastIndexOf('/');
  return separator === -1 ? normalized : normalized.slice(separator + 1);
}
