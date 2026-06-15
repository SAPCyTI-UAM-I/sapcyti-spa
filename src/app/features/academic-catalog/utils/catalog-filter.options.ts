import type { I18nKey } from '../../../core/i18n/i18n-keys.generated';
import { ProgramType } from '../../../models/student.model';

export interface CatalogSelectOption<T extends string = string> {
  readonly labelKey: I18nKey;
  readonly value: T;
}

export const CATALOG_STATUS_FILTER_OPTIONS: CatalogSelectOption[] = [
  { labelKey: 'ACADEMIC_CATALOG.FILTERS.ALL', value: '' },
  { labelKey: 'ACADEMIC_CATALOG.STATUS.ACTIVE', value: 'true' },
  { labelKey: 'ACADEMIC_CATALOG.STATUS.INACTIVE', value: 'false' },
];

export const CATALOG_PROGRAM_TYPE_FILTER_OPTIONS: CatalogSelectOption[] = [
  { labelKey: 'ACADEMIC_CATALOG.FILTERS.ALL', value: '' },
  { labelKey: 'ACADEMIC_CATALOG.PROGRAM_TYPES.MAESTRIA', value: 'MAESTRIA' },
  { labelKey: 'ACADEMIC_CATALOG.PROGRAM_TYPES.DOCTORADO', value: 'DOCTORADO' },
];

export const CATALOG_PROGRAM_TYPE_OPTIONS: CatalogSelectOption<ProgramType>[] = [
  { labelKey: 'ACADEMIC_CATALOG.PROGRAM_TYPES.MAESTRIA', value: 'MAESTRIA' },
  { labelKey: 'ACADEMIC_CATALOG.PROGRAM_TYPES.DOCTORADO', value: 'DOCTORADO' },
];

export function parseActiveFilter(value: string): boolean | undefined {
  return value === '' ? undefined : value === 'true';
}

export function parseProgramTypeFilter(value: string): ProgramType | undefined {
  return value === 'MAESTRIA' || value === 'DOCTORADO' ? value : undefined;
}
