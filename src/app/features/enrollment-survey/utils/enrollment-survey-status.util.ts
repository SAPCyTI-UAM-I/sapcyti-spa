import { CatalogTagSeverity } from '../../../core/theme/design-tokens';
import { SurveyStatus } from '../../../models';

const STATUS_SEVERITY: Record<SurveyStatus, CatalogTagSeverity> = {
  PROGRAMADO: 'info',
  ACTIVO: 'success',
  CERRADO: 'secondary',
};

export function statusTagSeverity(status: SurveyStatus): CatalogTagSeverity {
  return STATUS_SEVERITY[status];
}
