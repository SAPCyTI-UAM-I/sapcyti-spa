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

export type SurveyAction = 'edit' | 'delete' | 'close' | 'reopen';

export interface SurveyActionDescriptor {
  action: SurveyAction;
  labelKey: string;
}

const ACTION_LABEL: Record<SurveyAction, string> = {
  edit: 'ENROLLMENT_SURVEY.ACTIONS.EDIT',
  delete: 'ENROLLMENT_SURVEY.ACTIONS.DELETE',
  close: 'ENROLLMENT_SURVEY.ACTIONS.CLOSE',
  reopen: 'ENROLLMENT_SURVEY.ACTIONS.REOPEN',
};

const descriptor = (action: SurveyAction): SurveyActionDescriptor => ({
  action,
  labelKey: ACTION_LABEL[action],
});

/**
 * Actions shown on the survey **detail** screen. `close` / `reopen` live on the edit
 * screen, not here. `delete` is only offered for a PROGRAMADO survey with no responses
 * (hidden otherwise, not shown disabled) — HU-40.
 */
export function allowedActions(
  status: SurveyStatus,
  responseCount: number,
): SurveyActionDescriptor[] {
  if (status === 'PROGRAMADO' && responseCount === 0) {
    return [descriptor('edit'), descriptor('delete')];
  }
  return [descriptor('edit')];
}
