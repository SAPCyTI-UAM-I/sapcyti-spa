import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Drawer } from 'primeng/drawer';

import { ShellNavContentComponent } from './shell-nav-content.component';
import { ShellNavigation } from './shell-menu.model';

@Component({
  selector: 'app-shell-mobile-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, Drawer, ShellNavContentComponent],
  template: `
    <p-drawer
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
      [modal]="true"
      [closable]="true"
      styleClass="shell-mobile-drawer w-[280px] max-w-[calc(100vw-32px)]"
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

        <app-shell-nav-content [navigation]="nav" (logout)="logout.emit()" />
      }
    </p-drawer>
  `,
})
export class ShellMobileDrawerComponent {
  readonly visible = model(false);
  readonly navigation = input<ShellNavigation | null>(null);
  readonly logout = output<void>();
}
