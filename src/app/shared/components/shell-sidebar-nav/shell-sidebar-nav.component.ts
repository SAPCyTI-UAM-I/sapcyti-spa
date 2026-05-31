import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ShellNavigation } from '../../../shell/shell-menu.model';
import { ShellNavContentComponent } from '../../../shell/shell-nav-content.component';

@Component({
  selector: 'app-shell-sidebar-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, ShellNavContentComponent],
  template: `
    @if (navigation(); as nav) {
      <aside
        class="border-sidebar-border bg-sidebar py-lg fixed top-0 left-0 z-50 hidden h-screen w-[280px] flex-col border-r md:flex"
        aria-label="Main navigation"
      >
        <div class="mb-xl px-gutter">
          <h1 class="text-h2 text-primary font-h2 font-black tracking-tight">
            {{ 'SHELL.BRAND.TITLE' | translate }}
          </h1>
          <p class="text-caption text-text-secondary font-caption mt-xs">
            {{ 'SHELL.BRAND.SUBTITLE' | translate }}
          </p>
        </div>

        <app-shell-nav-content [navigation]="nav" (logout)="logout.emit()" />
      </aside>
    }
  `,
})
export class ShellSidebarNavComponent {
  readonly navigation = input.required<ShellNavigation | null>();
  readonly logout = output<void>();
}
