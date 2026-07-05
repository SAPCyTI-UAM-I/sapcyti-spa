import { CatalogTagSeverity } from '../../../core/theme/design-tokens';
import { AnnualPlanStatus } from '../../../models';

/** Status → PrimeNG tag severity (reuses the catalog badge palette). */
const STATUS_SEVERITY: Record<AnnualPlanStatus, CatalogTagSeverity> = {
  BORRADOR: 'warn',
  TERMINADA: 'success',
  ARCHIVADA: 'secondary',
};

export function statusTagSeverity(status: AnnualPlanStatus): CatalogTagSeverity {
  return STATUS_SEVERITY[status];
}

/** Linear order; transitions are allowed only between adjacent states. */
const STATUS_ORDER: readonly AnnualPlanStatus[] = ['BORRADOR', 'TERMINADA', 'ARCHIVADA'];

/** The states reachable from `status` in one step (for enabling action buttons). */
export function nextStatuses(status: AnnualPlanStatus): AnnualPlanStatus[] {
  const index = STATUS_ORDER.indexOf(status);
  return [STATUS_ORDER[index - 1], STATUS_ORDER[index + 1]].filter(
    (value): value is AnnualPlanStatus => value !== undefined,
  );
}

export function isAdjacent(from: AnnualPlanStatus, to: AnnualPlanStatus): boolean {
  return Math.abs(STATUS_ORDER.indexOf(from) - STATUS_ORDER.indexOf(to)) === 1;
}
