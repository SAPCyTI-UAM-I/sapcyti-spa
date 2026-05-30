import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Drawer } from 'primeng/drawer';

import { ShellSidebarLinkComponent } from '../shared/components/shell-sidebar-link/shell-sidebar-link.component';
import { ShellNavigation } from './shell-menu.model';

@Component({
  selector: 'app-shell-mobile-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, Button, Drawer, ShellSidebarLinkComponent],
  template: `
    <p-drawer
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
      [modal]="true"
      [closable]="true"
      styleClass="w-[280px]"
    >
      @if (navigation(); as nav) {
        <ng-template pTemplate="header">
          <div class="px-1">
            <h1 class="text-h2 text-primary font-h2 font-black tracking-tight">
              {{ 'SHELL.BRAND.TITLE' | translate }}
            </h1>
            <p class="text-caption text-text-secondary font-caption mt-xs">
              {{ 'SHELL.BRAND.SUBTITLE' | translate }}
            </p>
          </div>
        </ng-template>

        <nav class="flex flex-1 flex-col gap-1 overflow-y-auto">
          <app-shell-sidebar-link
            [route]="nav.home.route"
            [labelKey]="nav.home.labelKey"
            [icon]="nav.home.icon"
            [exact]="true"
          />

          @for (section of nav.sections; track section.id) {
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

        <div class="border-sidebar-border pt-md mt-auto border-t">
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
      }
    </p-drawer>
  `,
})
export class ShellMobileDrawerComponent {
  readonly visible = model(false);
  readonly navigation = input<ShellNavigation | null>(null);
  readonly logout = output<void>();
}
