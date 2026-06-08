import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';

import { AuthStateService } from '../../../core/auth/auth.service';
import { logoutAndNavigateToLogin } from '../../../core/auth/utils/logout-navigation.util';

@Component({
  selector: 'app-access-denied',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, Message, Button],
  template: `
    <div class="flex min-h-[60vh] w-full items-start justify-center">
      <section
        class="bg-surface border-outline p-lg md:p-xl gap-lg flex w-full max-w-3xl flex-col rounded-xl border"
      >
        <p-message
          severity="error"
          [text]="'COMMON.ERRORS.ACCESS_DENIED' | translate"
          icon="pi pi-lock"
          styleClass="w-full justify-start"
        />

        <p class="text-body-md text-text-secondary font-body-md">
          {{ 'COMMON.ERRORS.ACCESS_DENIED_MSG' | translate }}
        </p>

        <div>
          <p-button
            [label]="'COMMON.ACTIONS.BACK' | translate"
            icon="pi pi-arrow-left"
            (onClick)="goToLogin()"
            [outlined]="true"
          />
        </div>
      </section>
    </div>
  `,
})
export class AccessDeniedComponent {
  private readonly auth = inject(AuthStateService);
  private readonly router = inject(Router);

  goToLogin(): void {
    logoutAndNavigateToLogin(this.auth, this.router);
  }
}
