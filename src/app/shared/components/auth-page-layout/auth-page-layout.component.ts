import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-auth-page-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LanguageSwitcherComponent],
  template: `
    <div class="bg-surface-100 relative flex min-h-screen flex-col items-center justify-center p-6">
      <div class="fixed top-6 right-6 z-10">
        <app-language-switcher />
      </div>

      <main class="flex w-full flex-col items-center">
        <ng-content />
      </main>

      <footer
        class="text-surface-500 fixed bottom-0 flex w-full flex-col items-center gap-2 pb-6 text-xs"
      >
        <ng-content select="[authFooter]" />
      </footer>
    </div>
  `,
})
export class AuthPageLayoutComponent {}
