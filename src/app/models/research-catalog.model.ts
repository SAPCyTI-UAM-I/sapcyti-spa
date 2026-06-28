import type { I18nKey } from '../core/i18n/i18n-keys.generated';

export interface ResearchAreaCatalogItem {
  readonly line: string;
  readonly areas: readonly string[];
}

export interface ResearchCatalogOption {
  readonly value: string;
  readonly labelKey: I18nKey;
}

export const RESEARCH_CATALOG: readonly ResearchAreaCatalogItem[] = [
  {
    line: 'Ciencias e Ingeniería de la Computación',
    areas: [
      'Supercómputo (cómputo de alto rendimiento)',
      'Manejo de datos masivos (Big data)',
      'Web semántica',
      'Internet de las cosas',
      'Inteligencia artificial',
    ],
  },
  {
    line: 'Redes de Comunicaciones',
    areas: [
      'Comunicaciones inalámbricas',
      'Aplicaciones de redes',
      'Redes definidas por software',
      'Codificación de red',
      'Encaminamiento (ruteo)',
      'Procesamiento digital de señales en las comunicaciones',
    ],
  },
];

const LINE_OF_KNOWLEDGE_LABEL_KEYS: Readonly<Record<string, I18nKey>> = {
  'Ciencias e Ingeniería de la Computación':
    'ACADEMIC_CATALOG.STUDENT_PROGRAM.CATALOG.LINES.COMPUTER_SCIENCE',
  'Redes de Comunicaciones': 'ACADEMIC_CATALOG.STUDENT_PROGRAM.CATALOG.LINES.NETWORKS',
};

const RESEARCH_AREA_LABEL_KEYS: Readonly<Record<string, I18nKey>> = {
  'Supercómputo (cómputo de alto rendimiento)':
    'ACADEMIC_CATALOG.STUDENT_PROGRAM.CATALOG.AREAS.HIGH_PERFORMANCE_COMPUTING',
  'Manejo de datos masivos (Big data)': 'ACADEMIC_CATALOG.STUDENT_PROGRAM.CATALOG.AREAS.BIG_DATA',
  'Web semántica': 'ACADEMIC_CATALOG.STUDENT_PROGRAM.CATALOG.AREAS.SEMANTIC_WEB',
  'Internet de las cosas': 'ACADEMIC_CATALOG.STUDENT_PROGRAM.CATALOG.AREAS.IOT',
  'Inteligencia artificial': 'ACADEMIC_CATALOG.STUDENT_PROGRAM.CATALOG.AREAS.AI',
  'Comunicaciones inalámbricas':
    'ACADEMIC_CATALOG.STUDENT_PROGRAM.CATALOG.AREAS.WIRELESS_COMMUNICATIONS',
  'Aplicaciones de redes': 'ACADEMIC_CATALOG.STUDENT_PROGRAM.CATALOG.AREAS.NETWORK_APPLICATIONS',
  'Redes definidas por software':
    'ACADEMIC_CATALOG.STUDENT_PROGRAM.CATALOG.AREAS.SOFTWARE_DEFINED_NETWORKS',
  'Codificación de red': 'ACADEMIC_CATALOG.STUDENT_PROGRAM.CATALOG.AREAS.NETWORK_CODING',
  'Encaminamiento (ruteo)': 'ACADEMIC_CATALOG.STUDENT_PROGRAM.CATALOG.AREAS.ROUTING',
  'Procesamiento digital de señales en las comunicaciones':
    'ACADEMIC_CATALOG.STUDENT_PROGRAM.CATALOG.AREAS.DIGITAL_SIGNAL_PROCESSING',
};

export function getAreasForLine(line: string): readonly string[] {
  return RESEARCH_CATALOG.find((item) => item.line === line)?.areas ?? [];
}

export function isAreaInLine(line: string, area: string): boolean {
  return getAreasForLine(line).includes(area);
}

export function getLineOfKnowledgeLabelKey(line: string): I18nKey | null {
  return LINE_OF_KNOWLEDGE_LABEL_KEYS[line] ?? null;
}

export function getResearchAreaLabelKey(area: string): I18nKey | null {
  return RESEARCH_AREA_LABEL_KEYS[area] ?? null;
}

export function toLineOfKnowledgeOptions(
  catalog: readonly ResearchAreaCatalogItem[],
): ResearchCatalogOption[] {
  return catalog
    .map((item) => {
      const labelKey = getLineOfKnowledgeLabelKey(item.line);
      return labelKey ? { value: item.line, labelKey } : null;
    })
    .filter((option): option is ResearchCatalogOption => option !== null);
}

export function toResearchAreaOptions(
  catalog: readonly ResearchAreaCatalogItem[],
  line: string,
): ResearchCatalogOption[] {
  const areas = catalog.find((item) => item.line === line)?.areas ?? [];
  return areas
    .map((area) => {
      const labelKey = getResearchAreaLabelKey(area);
      return labelKey ? { value: area, labelKey } : null;
    })
    .filter((option): option is ResearchCatalogOption => option !== null);
}
