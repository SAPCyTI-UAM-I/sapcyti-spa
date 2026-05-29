import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';

import { AuthStateService } from '../../../core/auth/auth.service';
import { resolveShellMenuRole } from '../../../shell/shell-menu.config';

@Component({
  selector: 'app-dashboard-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <div class="mb-6">
      <h1 class="text-surface-900 text-2xl font-semibold">
        {{ titleKey() | translate }}
      </h1>
      <p class="text-surface-500 mt-1 text-sm">
        {{ subtitleKey() | translate }}
      </p>
    </div>

    <div class="border-surface-200 bg-surface-0 rounded-xl border p-6 shadow-sm">
      <p class="text-surface-600 text-sm">
        {{ 'DASHBOARD.HOME.PLACEHOLDER' | translate }}
      </p>
    </div>
  `,
})
export class DashboardHomeComponent {
  private readonly auth = inject(AuthStateService);
  private readonly currentUser = toSignal(this.auth.currentUser$, { initialValue: null });

  readonly menuRole = computed(() => {
    const user = this.currentUser();
    return user ? resolveShellMenuRole(user.role) : null;
  });

  readonly titleKey = computed(() => {
    const role = this.menuRole();
    return role ? `DASHBOARD.HOME.${role}.TITLE` : 'DASHBOARD.PLACEHOLDER.TITLE';
  });

  readonly subtitleKey = computed(() => {
    const role = this.menuRole();
    return role ? `DASHBOARD.HOME.${role}.SUBTITLE` : 'DASHBOARD.PLACEHOLDER.MESSAGE';
  });
}
