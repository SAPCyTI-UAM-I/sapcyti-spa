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

        <nav class="gap-sm px-sm flex flex-1 flex-col overflow-y-auto">
          <app-shell-sidebar-link
            [route]="nav.home.route"
            [labelKey]="nav.home.labelKey"
            [icon]="nav.home.icon"
            [exact]="true"
          />

          @for (section of nav.sections; track section.id) {
            <div class="mt-md mb-xs px-md py-sm">
              <span
                class="text-caption text-text-tertiary font-caption font-bold tracking-wider uppercase"
              >
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

        <div class="border-sidebar-border px-gutter pt-md mt-auto border-t">
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
