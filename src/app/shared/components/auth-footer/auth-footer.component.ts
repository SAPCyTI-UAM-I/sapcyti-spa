import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { APP_VERSION } from '../../../core/config/app-version';
import { SupportBannerComponent } from '../support-banner/support-banner.component';

@Component({
  selector: 'app-auth-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'gap-sm flex w-full flex-col items-center',
  },
  imports: [TranslatePipe, SupportBannerComponent],
  template: `
    @if (supportVisible()) {
      <div class="mb-xs flex w-full justify-center">
        <app-support-banner [(visible)]="supportVisible" />
      </div>
    }

    <div class="gap-md text-body-sm text-text-secondary flex flex-wrap justify-center">
      <span class="text-text-tertiary cursor-default">
        {{ 'AUTH.LOGIN.FOOTER.PRIVACY' | translate }}
      </span>
      <button
        type="button"
        class="hover:text-primary cursor-pointer transition-colors hover:underline"
        data-testid="support-button"
        (click)="toggleSupport()"
      >
        {{ 'AUTH.LOGIN.FOOTER.SUPPORT' | translate }}
      </button>
      <span class="text-text-tertiary cursor-default">
        {{ 'AUTH.LOGIN.FOOTER.TERMS' | translate }}
      </span>
    </div>

    <p
      class="text-text-secondary text-caption flex flex-wrap items-center justify-center gap-1.5 text-center text-balance"
    >
      <span>{{ 'AUTH.LOGIN.FOOTER.COPYRIGHT' | translate }}</span>
      <span class="text-text-tertiary" aria-hidden="true">·</span>
      <span class="text-text-tertiary font-mono font-medium">v{{ appVersion }}</span>
    </p>
  `,
})
export class AuthFooterComponent {
  readonly appVersion = APP_VERSION;
  readonly supportVisible = signal(false);

  toggleSupport(): void {
    this.supportVisible.update((visible) => !visible);
  }
}
