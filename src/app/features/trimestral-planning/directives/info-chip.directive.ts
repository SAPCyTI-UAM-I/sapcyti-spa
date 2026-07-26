import { Directive } from '@angular/core';

/**
 * Chip informativo de la planeación trimestral (grupo, cupo, alumnos, horario…).
 * El resumen de cada grupo repite la misma píldora media docena de veces; sin esto
 * cada una acababa con su propio radio y borde y el encabezado se veía desparejo.
 */
@Directive({
  selector: '[appInfoChip]',
  host: {
    class:
      'border-outline bg-surface px-sm py-xs gap-xs text-caption inline-flex min-w-0 items-center rounded-lg border',
  },
})
export class InfoChipDirective {}
