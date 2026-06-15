import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Button } from 'primeng/button';

import { ShellSidebarLinkComponent } from '../shared/components';
import { ShellNavigation } from './shell-menu.model';

/**
 * Shared navigation content used by both the desktop sidebar and the mobile drawer.
 *
 * Renders: home link → section headers → section items → logout button.
 * Each host is responsible for its own scroll container and borders.
 */
@Component({
  selector: 'app-shell-nav-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, Button, ShellSidebarLinkComponent],
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
      />

      @for (section of navigation().sections; track section.id) {
        @if (section.labelKey) {
          <div class="mt-md mb-xs px-md py-sm">
            <span
              class="text-caption text-text-tertiary font-caption font-bold tracking-wider uppercase"
            >
              {{ section.labelKey | translate }}
            </span>
          </div>
        }

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
  `,
})
export class ShellNavContentComponent {
  readonly navigation = input.required<ShellNavigation>();
  readonly logout = output<void>();
}
