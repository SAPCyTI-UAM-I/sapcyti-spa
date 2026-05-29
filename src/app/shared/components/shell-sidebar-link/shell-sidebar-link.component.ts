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
      routerLinkActive="border-primary bg-primary/10 text-primary border-l-4 font-semibold"
      [routerLinkActiveOptions]="{ exact: exact() }"
      class="text-surface-600 hover:bg-surface-100 mx-1 flex items-center gap-3 rounded-r-lg px-4 py-2 text-sm transition-colors"
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
