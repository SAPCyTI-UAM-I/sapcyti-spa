import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

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
          [class]="iconBgClass()"
        >
          <i [class]="icon() + ' ' + iconColorClass()" aria-hidden="true"></i>
        </div>
        @if (badgeKey()) {
          <span
            class="px-sm py-xs font-label-md text-caption max-w-full rounded font-bold"
            [class]="badgeClass()"
          >
            {{ badgeKey()! | translate }}
          </span>
        }
      </div>

      <div class="min-w-0">
        <span class="text-stat-value font-stat-value break-words" [class]="valueColorClass()">
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
            [class]="linkColorClass()"
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

  readonly iconBgClass = input('bg-primary-container');
  readonly iconColorClass = input('text-primary');
  readonly valueColorClass = input('text-primary');
  readonly linkColorClass = input('text-primary hover:text-primary-hover');
  readonly badgeClass = input('bg-primary-container text-primary');
}
