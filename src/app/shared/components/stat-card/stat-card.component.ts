import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, TranslatePipe],
  template: `
    <div
      class="bg-surface-0 border-surface-200 hover:border-surface-300 flex h-full flex-col justify-between rounded-xl border p-6 transition-colors"
    >
      <div class="mb-4 flex items-start justify-between">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg"
          [class]="iconBgClass()"
        >
          <i [class]="icon()" [ngClass]="iconColorClass()" aria-hidden="true"></i>
        </div>
        @if (badgeKey()) {
          <span
            class="rounded px-2 py-0.5 text-xs font-bold"
            [class]="badgeClass()"
          >
            {{ badgeKey()! | translate }}
          </span>
        }
      </div>

      <div>
        <span class="text-2xl font-bold" [class]="valueColorClass()">
          {{ value() }}
        </span>
        <p class="text-surface-500 mt-1 text-sm">{{ labelKey() | translate }}</p>
      </div>

      @if (linkRoute()) {
        <div class="border-surface-100 mt-4 border-t pt-4">
          <a
            class="group flex items-center text-sm font-medium transition-colors"
            [class]="linkColorClass()"
            [routerLink]="linkRoute()"
          >
            {{ linkKey()! | translate }}
            <i
              class="pi pi-arrow-right ml-1 text-xs transition-transform group-hover:translate-x-1"
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

  readonly color = input<'primary' | 'warning' | 'info' | 'success' | 'secondary'>('primary');

  readonly iconBgClass = input('bg-primary/10');
  readonly iconColorClass = input('text-primary');
  readonly valueColorClass = input('text-primary');
  readonly linkColorClass = input('text-primary hover:text-primary/80');
  readonly badgeClass = input('bg-primary/10 text-primary');
}
