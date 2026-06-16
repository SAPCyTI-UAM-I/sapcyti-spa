import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { Avatar } from 'primeng/avatar';
import { Menu } from 'primeng/menu';

import { UserMenuItem } from './user-menu.model';

/**
 * Top-bar avatar that opens a popup list of account actions.
 * Presentation only: it renders the items it is given and navigates on select,
 * so the host decides which actions are available (open/closed principle).
 */
@Component({
  selector: 'app-user-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Avatar, Menu],
  templateUrl: './user-menu.component.html',
})
export class UserMenuComponent {
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly initials = input.required<string>();
  readonly email = input<string | null>(null);
  readonly items = input.required<readonly UserMenuItem[]>();

  /** Tracks the popup state to drive `aria-expanded` on the trigger. */
  readonly menuOpen = signal(false);

  /** Re-evaluates labels when the active language changes. */
  private readonly lang = toSignal(this.translate.onLangChange, { initialValue: null });

  readonly model = computed<MenuItem[]>(() => {
    this.lang();
    return this.items().map((item) => ({
      label: this.translate.instant(item.labelKey),
      icon: item.icon,
      command: () => void this.router.navigateByUrl(item.route),
    }));
  });
}
