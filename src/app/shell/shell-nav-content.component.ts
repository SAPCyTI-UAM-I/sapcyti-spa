import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';

import { ShellSidebarLinkComponent } from '../shared/components';
import { ShellNavigation } from './shell-menu.model';

/**
 * Shared navigation content used by both the desktop sidebar and the mobile drawer.
 *
 * Renders: home link → section headers → section items → logout button.
 * When `collapsed` is set, section headers and labels are hidden so only icons
 * remain (desktop sidebar). Each host owns its own scroll container and borders.
 */
@Component({
  selector: 'app-shell-nav-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, Button, Tooltip, ShellSidebarLinkComponent],
  host: {
    class: 'flex min-h-0 flex-1 flex-col',
  },
  template: `
    <nav class="gap-sm px-sm flex flex-1 flex-col overflow-y-auto">
      <app-shell-sidebar-link
        [route]="navigation().home.route"
        [labelKey]="navigation().home.labelKey"
        [icon]="navigation().home.icon"
        [exact]="true"
        [collapsed]="collapsed()"
      />

      @for (section of navigation().sections; track section.id) {
        @if (section.labelKey) {
          @if (!collapsed()) {
            <div class="mt-sm px-md">
              <span
                class="text-caption text-text-tertiary font-caption font-bold tracking-wider uppercase"
              >
                {{ section.labelKey | translate }}
              </span>
            </div>
          } @else {
            <!-- Collapsed: keep the visual grouping with a short divider instead of the header. -->
            <div class="border-sidebar-border my-sm mx-auto w-8 border-t" aria-hidden="true"></div>
          }
        }

        @for (item of section.items; track item.id) {
          <app-shell-sidebar-link
            [route]="item.route"
            [labelKey]="item.labelKey"
            [icon]="item.icon"
            [collapsed]="collapsed()"
          />
        }
      }
    </nav>

    <div
      class="border-sidebar-border pt-md mt-auto border-t"
      [class.px-gutter]="!collapsed()"
      [class.px-sm]="collapsed()"
    >
      <p-button
        type="button"
        [label]="collapsed() ? undefined : ('SHELL.TOPBAR.LOGOUT' | translate)"
        icon="pi pi-sign-out"
        severity="secondary"
        variant="text"
        [styleClass]="collapsed() ? 'w-full justify-center' : 'w-full justify-start'"
        [pTooltip]="'SHELL.TOPBAR.LOGOUT' | translate"
        [tooltipDisabled]="!collapsed()"
        tooltipPosition="right"
        [attr.aria-label]="'SHELL.TOPBAR.LOGOUT' | translate"
        (onClick)="logout.emit()"
      />
    </div>
  `,
})
export class ShellNavContentComponent {
  readonly navigation = input.required<ShellNavigation>();
  readonly collapsed = input(false);
  readonly logout = output<void>();
}
