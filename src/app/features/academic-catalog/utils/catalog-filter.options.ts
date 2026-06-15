import { ProgramType } from '../../../models/student.model';

export interface CatalogSelectOption<T extends string = string> {
  readonly label: string;
  readonly value: T;
}

export const CATALOG_STATUS_FILTER_OPTIONS: CatalogSelectOption[] = [
  { label: 'ACADEMIC_CATALOG.FILTERS.ALL', value: '' },
  { label: 'ACADEMIC_CATALOG.STATUS.ACTIVE', value: 'true' },
  { label: 'ACADEMIC_CATALOG.STATUS.INACTIVE', value: 'false' },
];

export const CATALOG_PROGRAM_TYPE_FILTER_OPTIONS: CatalogSelectOption[] = [
  { label: 'ACADEMIC_CATALOG.FILTERS.ALL', value: '' },
  { label: 'ACADEMIC_CATALOG.PROGRAM_TYPES.MAESTRIA', value: 'MAESTRIA' },
  { label: 'ACADEMIC_CATALOG.PROGRAM_TYPES.DOCTORADO', value: 'DOCTORADO' },
];

export const CATALOG_PROGRAM_TYPE_OPTIONS: CatalogSelectOption<ProgramType>[] = [
  { label: 'ACADEMIC_CATALOG.PROGRAM_TYPES.MAESTRIA', value: 'MAESTRIA' },
  { label: 'ACADEMIC_CATALOG.PROGRAM_TYPES.DOCTORADO', value: 'DOCTORADO' },
];

export function parseActiveFilter(value: string): boolean | undefined {
  return value === '' ? undefined : value === 'true';
}

export function parseProgramTypeFilter(value: string): ProgramType | undefined {
  return value === 'MAESTRIA' || value === 'DOCTORADO' ? value : undefined;
}
