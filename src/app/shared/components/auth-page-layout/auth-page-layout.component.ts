import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-auth-page-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LanguageSwitcherComponent],
  template: `
    <div class="bg-surface-muted text-on-surface font-body-md relative flex min-h-dvh flex-col">
      <header class="top-lg right-lg fixed z-50 hidden sm:flex">
        <app-language-switcher variant="auth" />
      </header>

      <main class="px-margin py-xxl flex w-full flex-1 items-center justify-center">
        <div class="w-full max-w-[420px]">
          <ng-content />
        </div>
      </main>

      <footer
        class="text-on-surface-variant pb-lg text-caption font-caption px-gutter mt-lg flex w-full justify-center"
      >
        <ng-content select="app-auth-footer" />
      </footer>
    </div>
  `,
})
export class AuthPageLayoutComponent {}
