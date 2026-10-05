import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { PlanSummaryCounts } from '../../utils/plan-summary.util';
import { GroupFilterState } from '../../utils/trimestral-group-filter.util';

/**
 * Conteos del plan como punto de partida del trabajo: cada cifra accionable aplica
 * el filtro que deja en pantalla exactamente esos grupos, así que el encabezado es
 * una cola de pendientes y no un tablero de solo lectura.
 */
@Component({
  selector: 'app-plan-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  templateUrl: './plan-summary.component.html',
})
export class PlanSummaryComponent {
  readonly counts = input.required<PlanSummaryCounts>();
  readonly applyFilter = output<GroupFilterState>();
}
