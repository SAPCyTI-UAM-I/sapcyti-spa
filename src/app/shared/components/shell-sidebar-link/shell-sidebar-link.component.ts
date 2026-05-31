import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-shell-sidebar-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  template: `
    <a
      [routerLink]="route()"
      routerLinkActive="border-primary bg-primary-container text-primary border-l-4 font-bold"
      [routerLinkActiveOptions]="{ exact: exact() }"
      class="text-label-md text-text-secondary font-label-md hover:bg-surface-subtle mx-sm gap-md px-md py-sm flex items-center rounded-lg transition-colors"
    >
      <i [class]="icon()" aria-hidden="true"></i>
      <span>{{ labelKey() | translate }}</span>
    </a>
  `,
})
export class ShellSidebarLinkComponent {
  readonly route = input.required<string>();
  readonly labelKey = input.required<string>();
  readonly icon = input.required<string>();
  readonly exact = input(false);
}
