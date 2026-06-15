import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

export type CardTone = 'primary' | 'secondary' | 'warning' | 'info';

interface ToneClasses {
  iconBgClass: string;
  iconColorClass: string;
  valueColorClass: string;
  linkColorClass: string;
  badgeClass: string;
}

const TONE_CLASSES: Record<CardTone, ToneClasses> = {
  primary: {
    iconBgClass: 'bg-primary-container',
    iconColorClass: 'text-primary',
    valueColorClass: 'text-primary',
    linkColorClass: 'text-primary hover:text-primary-hover',
    badgeClass: 'bg-primary-container text-primary',
  },
  secondary: {
    iconBgClass: 'bg-secondary-container',
    iconColorClass: 'text-secondary',
    valueColorClass: 'text-on-surface',
    linkColorClass: 'text-secondary hover:text-on-secondary-container',
    badgeClass: 'bg-secondary-container text-on-secondary-container',
  },
  warning: {
    iconBgClass: 'bg-warning-container',
    iconColorClass: 'text-warning',
    valueColorClass: 'text-warning',
    linkColorClass: 'text-warning hover:text-warning-strong',
    badgeClass: 'bg-warning-container text-warning',
  },
  info: {
    iconBgClass: 'bg-info-container',
    iconColorClass: 'text-info',
    valueColorClass: 'text-info',
    linkColorClass: 'text-info hover:text-info-strong',
    badgeClass: 'bg-info-container text-info',
  },
};

@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe],
  host: {
    class: 'block min-w-0',
  },
  template: `
    <div
      class="bg-surface border-outline hover:border-outline-strong p-lg flex h-full min-w-0 flex-col justify-between rounded-xl border transition-colors"
    >
      <div class="mb-md gap-md flex min-w-0 items-start justify-between">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          [class]="toneClasses().iconBgClass"
        >
          <i [class]="icon() + ' ' + toneClasses().iconColorClass" aria-hidden="true"></i>
        </div>
        @if (badgeKey()) {
          <span
            class="px-sm py-xs font-label-md text-caption max-w-full rounded font-bold"
            [class]="toneClasses().badgeClass"
          >
            {{ badgeKey()! | translate }}
          </span>
        }
      </div>

      <div class="min-w-0">
        <span
          class="text-stat-value font-stat-value break-words"
          [class]="toneClasses().valueColorClass"
        >
          {{ value() }}
        </span>
        <p class="text-body-md text-text-secondary font-body-md mt-xs break-words">
          {{ labelKey() | translate }}
        </p>
      </div>

      @if (linkRoute()) {
        <div class="border-surface-muted mt-md pt-md border-t">
          <a
            class="text-label-md font-label-md group gap-xs flex min-w-0 items-center transition-colors"
            [class]="toneClasses().linkColorClass"
            [routerLink]="linkRoute()"
          >
            <span class="min-w-0 break-words">{{ linkKey()! | translate }}</span>
            <i
              class="pi pi-arrow-right shrink-0 text-[18px] transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            ></i>
          </a>
        </div>
      }
    </div>
  `,
})
export class StatCardComponent {
  readonly icon = input.required<string>();
  readonly value = input.required<string | number>();
  readonly labelKey = input.required<string>();
  readonly linkKey = input<string>();
  readonly linkRoute = input<string>();
  readonly badgeKey = input<string>();
  readonly tone = input<CardTone>('primary');

  protected readonly toneClasses = computed(() => TONE_CLASSES[this.tone()]);
}
