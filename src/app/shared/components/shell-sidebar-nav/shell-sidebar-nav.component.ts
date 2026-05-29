import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Button } from 'primeng/button';

import { ShellNavigation } from '../../../shell/shell-menu.model';
import { ShellSidebarLinkComponent } from '../shell-sidebar-link/shell-sidebar-link.component';

@Component({
  selector: 'app-shell-sidebar-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, Button, ShellSidebarLinkComponent],
  template: `
    @if (navigation(); as nav) {
      <aside
        class="border-surface-200 bg-surface-0 fixed top-0 left-0 z-50 hidden h-screen w-[280px] flex-col border-r py-6 md:flex"
        aria-label="Main navigation"
      >
        <div class="mb-8 px-4">
          <h1 class="text-primary text-xl font-black tracking-tight">
            {{ 'SHELL.BRAND.TITLE' | translate }}
          </h1>
          <p class="text-surface-500 mt-1 text-xs">
            {{ 'SHELL.BRAND.SUBTITLE' | translate }}
          </p>
        </div>

        <nav class="flex flex-1 flex-col gap-1 overflow-y-auto px-2">
          <app-shell-sidebar-link
            [route]="nav.home.route"
            [labelKey]="nav.home.labelKey"
            [icon]="nav.home.icon"
            [exact]="true"
          />

          @for (section of nav.sections; track section.id) {
            <div class="mt-4 px-3">
              <span class="text-surface-400 text-[11px] font-bold tracking-wider uppercase">
                {{ section.labelKey | translate }}
              </span>
            </div>

            @for (item of section.items; track item.id) {
              <app-shell-sidebar-link
                [route]="item.route"
                [labelKey]="item.labelKey"
                [icon]="item.icon"
              />
            }
          }
        </nav>

        <div class="border-surface-200 mt-auto border-t px-4 pt-4">
          <p-button
            type="button"
            [label]="'SHELL.TOPBAR.LOGOUT' | translate"
            icon="pi pi-sign-out"
            severity="secondary"
            variant="text"
            styleClass="w-full justify-start"
            (onClick)="logout.emit()"
          />
        </div>
      </aside>
    }
  `,
})
export class ShellSidebarNavComponent {
  readonly navigation = input.required<ShellNavigation | null>();
  readonly logout = output<void>();
}
