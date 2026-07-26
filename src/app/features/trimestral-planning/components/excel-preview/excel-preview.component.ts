import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { TrimestralPlanDetail } from '../../../../models';
import { flattenPlanForPreview } from '../../utils/excel-preview.util';

/**
 * HU-60 — cómo se verá el Excel entregado, en solo lectura.
 *
 * Se alimenta del plan guardado y no del formulario: el apilado de filas lo define el
 * exportador del backend, y reconstruirlo desde el borrador invitaría a que las dos
 * versiones se separen. Con ediciones sin guardar se avisa en vez de mentir.
 */
@Component({
  selector: 'app-excel-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  templateUrl: './excel-preview.component.html',
})
export class ExcelPreviewComponent {
  readonly plan = input.required<TrimestralPlanDetail>();
  readonly stale = input(false);

  readonly rows = computed(() => flattenPlanForPreview(this.plan()));

  /** Encabezados del formato oficial, en el orden de las columnas del archivo. */
  readonly dayColumns = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE'] as const;
}
