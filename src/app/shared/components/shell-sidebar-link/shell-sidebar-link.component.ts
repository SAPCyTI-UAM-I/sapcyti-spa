import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'app-shell-sidebar-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, TranslateModule, Tooltip],
  template: `
    @if (disabled()) {
      <!-- Control visible pero no navegable: el motivo se anuncia y se muestra en tooltip. -->
      <span
        role="link"
        aria-disabled="true"
        tabindex="-1"
        class="text-label-md text-text-tertiary font-label-md mx-sm gap-md px-md py-sm flex cursor-not-allowed items-center rounded-lg"
        [class.justify-center]="collapsed()"
        [pTooltip]="tooltipKey() | translate"
        [tooltipDisabled]="false"
        tooltipPosition="right"
        [attr.aria-label]="tooltipKey() | translate"
      >
        <i [class]="icon()" aria-hidden="true"></i>
        @if (!collapsed()) {
          <span>{{ labelKey() | translate }}</span>
        }
      </span>
    } @else {
      <a
        [routerLink]="route()"
        routerLinkActive="border-primary bg-primary-container text-primary border-l-4 font-bold"
        [routerLinkActiveOptions]="{ exact: exact() }"
        class="text-label-md text-text-secondary font-label-md hover:bg-surface-subtle mx-sm gap-md px-md py-sm flex items-center rounded-lg transition-colors"
        [class.justify-center]="collapsed()"
        [pTooltip]="labelKey() | translate"
        [tooltipDisabled]="!collapsed()"
        tooltipPosition="right"
        [attr.aria-label]="collapsed() ? (labelKey() | translate) : null"
      >
        <i [class]="icon()" aria-hidden="true"></i>
        @if (!collapsed()) {
          <span>{{ labelKey() | translate }}</span>
        }
      </a>
    }
  `,
})
export class ShellSidebarLinkComponent {
  readonly route = input.required<string>();
  readonly labelKey = input.required<string>();
  readonly icon = input.required<string>();
  readonly exact = input(false);
  readonly collapsed = input(false);
  readonly disabled = input(false);
  readonly disabledReasonKey = input<string | null>(null);

  /** Tooltip: motivo de bloqueo si aplica; si no, la etiqueta del enlace. */
  readonly tooltipKey = computed(() => this.disabledReasonKey() ?? this.labelKey());
}
