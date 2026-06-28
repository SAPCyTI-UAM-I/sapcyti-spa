import type { ProgramStatus } from '../../../models';
import type { CatalogSelectOption } from './catalog-filter.options';

export const STUDENT_PROGRAM_STATUS_OPTIONS: CatalogSelectOption<ProgramStatus>[] = [
  { labelKey: 'ACADEMIC_CATALOG.STUDENT_PROGRAM.STATUS.ACTIVO', value: 'ACTIVO' },
  { labelKey: 'ACADEMIC_CATALOG.STUDENT_PROGRAM.STATUS.BAJA', value: 'BAJA' },
  { labelKey: 'ACADEMIC_CATALOG.STUDENT_PROGRAM.STATUS.EGRESADO', value: 'EGRESADO' },
];
