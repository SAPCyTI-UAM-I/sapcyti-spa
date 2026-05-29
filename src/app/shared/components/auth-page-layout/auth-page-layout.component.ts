import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-auth-page-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LanguageSwitcherComponent],
  template: `
    <div class="bg-brand-surface-muted flex min-h-dvh flex-col">
      <div
        class="mx-auto flex w-full max-w-[420px] flex-1 flex-col px-4 pt-5 pb-6 sm:px-6 sm:pt-8 sm:pb-10"
      >
        <header class="mb-4 flex shrink-0 items-center justify-end sm:mb-6">
          <app-language-switcher variant="auth" />
        </header>

        <main class="w-full flex-1">
          <ng-content />
        </main>
      </div>

      <footer
        class="text-brand-text-secondary border-brand-outline mt-auto border-t px-4 py-5 text-xs sm:px-6 sm:py-6"
      >
        <ng-content select="[authFooter]" />
      </footer>
    </div>
  `,
})
export class AuthPageLayoutComponent {}
