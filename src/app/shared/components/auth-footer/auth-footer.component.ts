import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    authFooter: '',
    class: 'block w-full space-y-2',
  },
  imports: [TranslatePipe],
  template: `
    <div class="flex flex-wrap justify-center gap-x-4 gap-y-2">
      <span class="hover:underline">{{ 'AUTH.LOGIN.FOOTER.PRIVACY' | translate }}</span>
      <span class="hover:underline">{{ 'AUTH.LOGIN.FOOTER.SUPPORT' | translate }}</span>
      <span class="hover:underline">{{ 'AUTH.LOGIN.FOOTER.TERMS' | translate }}</span>
    </div>
    <p class="text-center text-balance">
      {{ 'AUTH.LOGIN.FOOTER.COPYRIGHT' | translate }}
    </p>
  `,
})
export class AuthFooterComponent {}
