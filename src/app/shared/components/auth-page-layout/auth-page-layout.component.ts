import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-auth-page-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LanguageSwitcherComponent],
  template: `
    <div class="bg-surface-muted text-on-surface font-body-md relative min-h-dvh">
      <header class="top-lg right-lg fixed z-50 hidden sm:flex">
        <app-language-switcher variant="auth" />
      </header>

      <main class="px-margin py-xxl flex min-h-dvh w-full items-center justify-center">
        <div class="w-full max-w-[420px]">
          <ng-content />
        </div>
      </main>

      <footer
        class="text-on-surface-variant pb-lg text-caption font-caption fixed bottom-0 left-0 w-full px-4"
      >
        <ng-content select="[authFooter]" />
      </footer>
    </div>
  `,
})
export class AuthPageLayoutComponent {}
