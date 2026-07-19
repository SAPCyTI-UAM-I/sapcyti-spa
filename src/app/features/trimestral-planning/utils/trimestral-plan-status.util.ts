import { CatalogTagSeverity } from '../../../core/theme/design-tokens';
import { ScheduleDay, TrimestralPlanStatus } from '../../../models';

const STATUS_SEVERITY: Record<TrimestralPlanStatus, CatalogTagSeverity> = {
  BORRADOR: 'warn',
  TERMINADA: 'success',
};

export function statusTagSeverity(status: TrimestralPlanStatus): CatalogTagSeverity {
  return STATUS_SEVERITY[status];
}

/** Only BORRADOR is editable (same gate as the annual plan). */
export function isEditable(status: TrimestralPlanStatus): boolean {
  return status === 'BORRADOR';
}

export function dayLabelKey(day: ScheduleDay): string {
  return `TRIMESTRAL_PLANNING.DAYS.${day}`;
}

/**
 * Chronological rank of a term, most recent first: within a year the order is
 * Invierno → Primavera → Otoño. Used to sort plans and surveys client-side.
 */
export function termRank(term: string): number {
  const year = Number(term.slice(0, 2));
  const period = term.charAt(2).toUpperCase();
  const withinYear = period === 'I' ? 0 : period === 'P' ? 1 : 2;
  return year * 10 + withinYear;
}

/** Most recent term first. */
export function compareTermsDesc(a: string, b: string): number {
  return termRank(b) - termRank(a);
}
