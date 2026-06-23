import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthStateService } from '../../../core/auth/auth.service';
import { resolveShellMenuRole } from '../../../shell/shell-menu.config';
import { StatCardComponent } from '../../../shared/components';
import { DASHBOARD_CARDS_BY_ROLE } from '../dashboard-home.config';

@Component({
  selector: 'app-dashboard-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslateModule, StatCardComponent],
  templateUrl: './dashboard-home.component.html',
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

  readonly cards = computed(() => {
    const role = this.menuRole();
    return role ? (DASHBOARD_CARDS_BY_ROLE[role] ?? []) : [];
  });
}
