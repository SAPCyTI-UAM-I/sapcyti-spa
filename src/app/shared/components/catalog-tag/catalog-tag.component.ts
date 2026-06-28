import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Tag } from 'primeng/tag';

import {
  CATALOG_PROGRAM_TYPE_TAG,
  type CatalogTagSeverity,
} from '../../../core/theme/design-tokens';

/**
 * Wraps PrimeNG `p-tag` for catalog badges. Program-type severities (`maestria`,
 * `doctorado`) use dedicated colors from `CATALOG_PROGRAM_TYPE_TAG`.
 */
@Component({
  selector: 'app-catalog-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex',
  },
  imports: [Tag],
  template: `
    <p-tag
      [value]="value()"
      [severity]="primeSeverity()"
      [style.background]="customColors()?.background"
      [style.color]="customColors()?.color"
      [rounded]="rounded()"
    />
  `,
})
export class CatalogTagComponent {
  readonly value = input.required<string>();
  readonly severity = input.required<CatalogTagSeverity>();
  readonly rounded = input(true);

  readonly customColors = computed(() => {
    const severity = this.severity();
    if (severity === 'maestria' || severity === 'doctorado') {
      return CATALOG_PROGRAM_TYPE_TAG[severity];
    }
    return null;
  });

  readonly primeSeverity = computed(() => {
    const severity = this.severity();
    if (severity === 'maestria' || severity === 'doctorado') {
      return undefined;
    }
    return severity;
  });
}
