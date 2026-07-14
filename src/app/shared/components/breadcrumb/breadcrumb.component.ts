import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { BreadcrumbItem } from '../../../shell/breadcrumb';

/**
 * Top-bar breadcrumb: a home icon (link to dashboard) followed by the current
 * route trail as read-only labels. Intermediate crumbs are not links — the shell
 * menu is the primary navigation. When the trail has more than two crumbs it
 * collapses to `home › … › current` to save space; the hidden labels are kept in
 * the ellipsis tooltip for context.
 */
@Component({
  selector: 'app-breadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslateModule],
  templateUrl: './breadcrumb.component.html',
})
export class BreadcrumbComponent {
  private readonly translate = inject(TranslateService);

  readonly items = input.required<readonly BreadcrumbItem[]>();

  /** Re-translate the ellipsis tooltip when the language changes. */
  private readonly lang = toSignal(this.translate.onLangChange, { initialValue: null });

  readonly collapsed = computed(() => this.items().length > 2);

  readonly visible = computed<readonly BreadcrumbItem[]>(() =>
    this.collapsed() ? this.items().slice(-1) : this.items(),
  );

  readonly hiddenLabels = computed(() => {
    this.lang();
    if (!this.collapsed()) {
      return '';
    }
    return this.items()
      .slice(0, -1)
      .map((item) => this.translate.instant(item.labelKey) as string)
      .join(' › ');
  });
}
