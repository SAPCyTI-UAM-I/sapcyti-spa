import { CATALOG_TAG_SEVERITY, type CatalogTagSeverity } from '../../../core/theme/design-tokens';
import type { ProgramStatus, ProgramType } from '../../../models';

export type { CatalogTagSeverity };

export function programTypeTagSeverity(programType: ProgramType): CatalogTagSeverity {
  return CATALOG_TAG_SEVERITY.programType[programType];
}

export function activeTagSeverity(active: boolean): CatalogTagSeverity {
  return active
    ? CATALOG_TAG_SEVERITY.studentAccountStatus.active
    : CATALOG_TAG_SEVERITY.studentAccountStatus.inactive;
}

export function programStatusSeverity(status: ProgramStatus): CatalogTagSeverity {
  return CATALOG_TAG_SEVERITY.programStatus[status];
}
