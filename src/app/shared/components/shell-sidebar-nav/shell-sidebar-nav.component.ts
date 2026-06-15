import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';

import { ShellNavigation } from '../../../shell/shell-menu.model';
import { ShellNavContentComponent } from '../../../shell/shell-nav-content.component';

@Component({
  selector: 'app-shell-sidebar-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, TranslateModule, Button, Tooltip, ShellNavContentComponent],
  template: `
    @if (navigation(); as nav) {
      <aside
        class="border-sidebar-border bg-sidebar py-lg fixed top-0 left-0 z-50 hidden h-screen flex-col border-r transition-[width] duration-200 md:flex"
        [ngClass]="collapsed() ? 'w-[76px]' : 'w-[280px]'"
        aria-label="Main navigation"
      >
        <div
          class="mb-xl px-sm gap-sm flex items-center"
          [class.px-gutter]="!collapsed()"
          [class.justify-between]="!collapsed()"
          [class.justify-center]="collapsed()"
        >
          @if (!collapsed()) {
            <div class="min-w-0">
              <h1 class="text-h2 text-primary font-h2 font-black tracking-tight">
                {{ 'SHELL.BRAND.TITLE' | translate }}
              </h1>
              <p class="text-caption text-text-secondary font-caption mt-xs">
                {{ 'SHELL.BRAND.SUBTITLE' | translate }}
              </p>
            </div>
          }

          <p-button
            type="button"
            [icon]="collapsed() ? 'pi pi-angle-double-right' : 'pi pi-angle-double-left'"
            severity="secondary"
            variant="text"
            [rounded]="true"
            [pTooltip]="'SHELL.SIDEBAR.EXPAND' | translate"
            [tooltipDisabled]="!collapsed()"
            tooltipPosition="right"
            [attr.aria-label]="
              (collapsed() ? 'SHELL.SIDEBAR.EXPAND' : 'SHELL.SIDEBAR.COLLAPSE') | translate
            "
            (onClick)="toggleCollapse.emit()"
          />
        </div>

        <app-shell-nav-content
          [navigation]="nav"
          [collapsed]="collapsed()"
          (logout)="logout.emit()"
        />
      </aside>
    }
  `,
})
export class ShellSidebarNavComponent {
  readonly navigation = input.required<ShellNavigation | null>();
  readonly collapsed = input(false);
  readonly toggleCollapse = output<void>();
  readonly logout = output<void>();
}
