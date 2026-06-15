import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthStateService } from '../../../core/auth/auth.service';
import { resolveShellMenuRole } from '../../../shell/shell-menu.config';
import { StatCardComponent } from '../../../shared/components';
import { DASHBOARD_CARDS_BY_ROLE } from '../dashboard-home.config';

@Component({
  selector: 'app-dashboard-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslateModule, StatCardComponent],
  template: `
    <div class="mb-lg">
      <h1 class="text-headline-lg text-on-surface font-headline-lg">
        {{ titleKey() | translate }}
      </h1>
      <p class="text-body-md text-text-secondary font-body-md mt-xs">
        {{ subtitleKey() | translate }}
      </p>
    </div>

    @switch (menuRole()) {
      @case ('STUDENT') {
        <section
          class="bg-surface border-outline gap-lg p-lg flex min-w-0 flex-col rounded-xl border"
        >
          <div
            class="border-surface-subtle pb-sm flex min-w-0 items-center justify-between border-b"
          >
            <h2 class="text-h3 text-on-surface font-h3 gap-sm flex items-center">
              <i class="pi pi-graduation-cap text-primary" aria-hidden="true"></i>
              {{ 'DASHBOARD.STUDENT.ENROLLMENT_TITLE' | translate }}
            </h2>
          </div>

          <div
            class="gap-xl flex min-w-0 flex-col items-start justify-between md:flex-row md:items-center"
          >
            <div class="gap-xs flex min-w-0 flex-col">
              <span class="text-headline-sm text-on-surface font-headline-sm">
                {{ 'DASHBOARD.STUDENT.NAME' | translate }}
              </span>
              <div class="text-text-secondary gap-xs flex items-center">
                <i class="pi pi-id-card text-[16px]" aria-hidden="true"></i>
                <span class="text-body-md font-body-md">
                  {{ 'DASHBOARD.STUDENT.REGISTRATION' | translate }}
                </span>
              </div>
            </div>

            <div
              class="bg-surface-subtle gap-md p-md flex w-full min-w-0 flex-col rounded-lg md:w-[360px] md:shrink-0 md:items-end md:bg-transparent md:p-0"
            >
              <div
                class="border-warning/30 bg-warning/10 text-warning gap-sm px-md py-xs flex max-w-full items-center rounded-full border"
              >
                <i class="pi pi-clock text-[18px]" aria-hidden="true"></i>
                <span class="text-label-md font-label-md min-w-0 font-bold">
                  {{ 'DASHBOARD.STUDENT.STATUS' | translate }}
                </span>
              </div>
              <p
                class="text-body-md text-text-secondary font-body-md w-full text-left md:text-right"
              >
                {{ 'DASHBOARD.STUDENT.STATUS_MESSAGE' | translate }}
              </p>
              <a
                class="bg-primary hover:bg-primary-hover text-on-primary text-label-md font-label-md gap-sm px-lg py-sm mt-xs flex h-10 w-full items-center justify-center rounded-lg shadow-sm transition-colors md:w-auto"
                routerLink="/enrollment"
              >
                {{ 'DASHBOARD.STUDENT.ACTION' | translate }}
                <i class="pi pi-arrow-right text-[18px]" aria-hidden="true"></i>
              </a>
            </div>
          </div>
        </section>

        <section
          class="border-outline bg-surface-subtle mt-lg p-lg rounded-xl border border-dashed"
        >
          <h3
            class="text-label-md text-text-secondary font-label-md mb-md font-bold tracking-wider uppercase"
          >
            {{ 'DASHBOARD.STUDENT.FUTURE_STATES' | translate }}
          </h3>
          <div class="gap-md grid min-w-0 grid-cols-1 md:grid-cols-2">
            <div
              class="bg-surface border-outline gap-md p-md flex min-w-0 flex-col items-start justify-between rounded-lg border opacity-75 sm:flex-row sm:items-center"
            >
              <div
                class="border-info/30 bg-info/10 text-info gap-sm px-md py-xs flex max-w-full items-center rounded-full border"
              >
                <i class="pi pi-hourglass text-[18px]" aria-hidden="true"></i>
                <span class="text-label-md font-label-md min-w-0 font-bold">
                  {{ 'DASHBOARD.STUDENT.PENDING_REVIEW' | translate }}
                </span>
              </div>
              <span class="text-caption text-text-tertiary font-caption">
                {{ 'DASHBOARD.STUDENT.PHASE_2' | translate }}
              </span>
            </div>
            <div
              class="bg-surface border-outline gap-md p-md flex min-w-0 flex-col items-start justify-between rounded-lg border opacity-75 sm:flex-row sm:items-center"
            >
              <div
                class="border-success/30 bg-success/10 text-success gap-sm px-md py-xs flex max-w-full items-center rounded-full border"
              >
                <i class="pi pi-check-circle text-[18px]" aria-hidden="true"></i>
                <span class="text-label-md font-label-md min-w-0 font-bold">
                  {{ 'DASHBOARD.STUDENT.APPROVED' | translate }}
                </span>
              </div>
              <span class="text-caption text-text-tertiary font-caption">
                {{ 'DASHBOARD.STUDENT.PHASE_3' | translate }}
              </span>
            </div>
          </div>
        </section>
      }
      @default {
        <div class="gap-gutter lg:gap-margin grid min-w-0 grid-cols-1 md:grid-cols-2">
          @for (card of cards(); track card.labelKey) {
            <app-stat-card
              [icon]="card.icon"
              [value]="card.value"
              [labelKey]="card.labelKey"
              [linkKey]="card.linkKey"
              [linkRoute]="card.linkRoute"
              [badgeKey]="card.badgeKey"
              [iconBgClass]="card.iconBgClass"
              [iconColorClass]="card.iconColorClass"
              [valueColorClass]="card.valueColorClass"
              [linkColorClass]="card.linkColorClass"
              [badgeClass]="card.badgeClass ?? ''"
            />
          }
        </div>

        @if (menuRole() === 'PROFESSOR') {
          <section
            class="bg-surface border-outline mt-lg min-w-0 overflow-hidden rounded-xl border"
          >
            <div class="bg-table-header border-outline px-lg py-sm border-b">
              <h2 class="text-h2 text-on-surface font-h2">
                {{ 'DASHBOARD.PROFESSOR.ACTIVITY_TITLE' | translate }}
              </h2>
            </div>
            <div class="divide-sidebar-border divide-y">
              <div
                class="hover:bg-surface-subtle gap-md p-md flex min-w-0 flex-col items-start transition-colors sm:flex-row"
              >
                <div
                  class="bg-info/10 text-info mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                >
                  <i class="pi pi-send text-[18px]" aria-hidden="true"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-body-md text-on-surface font-body-md">
                    {{ 'DASHBOARD.PROFESSOR.ACTIVITY_1' | translate }}
                  </p>
                  <span class="text-caption text-text-tertiary font-caption mt-xs block">
                    {{ 'DASHBOARD.PROFESSOR.ACTIVITY_1_TIME' | translate }}
                  </span>
                </div>
                <a
                  class="text-label-md text-primary hover:bg-primary-container font-label-md px-sm py-xs rounded transition-colors"
                  routerLink="/enrollment/advisor-approval"
                >
                  {{ 'DASHBOARD.PROFESSOR.ACTIVITY_ACTION' | translate }}
                </a>
              </div>
              <div
                class="hover:bg-surface-subtle gap-md p-md flex min-w-0 items-start transition-colors"
              >
                <div
                  class="bg-success/10 text-success mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                >
                  <i class="pi pi-check-circle text-[18px]" aria-hidden="true"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-body-md text-on-surface font-body-md">
                    {{ 'DASHBOARD.PROFESSOR.ACTIVITY_2' | translate }}
                  </p>
                  <span class="text-caption text-text-tertiary font-caption mt-xs block">
                    {{ 'DASHBOARD.PROFESSOR.ACTIVITY_2_TIME' | translate }}
                  </span>
                </div>
              </div>
              <div
                class="hover:bg-surface-subtle gap-md p-md flex min-w-0 items-start transition-colors"
              >
                <div
                  class="bg-surface-container-highest text-text-secondary mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                >
                  <i class="pi pi-upload text-[18px]" aria-hidden="true"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-body-md text-on-surface font-body-md">
                    {{ 'DASHBOARD.PROFESSOR.ACTIVITY_3' | translate }}
                  </p>
                  <span class="text-caption text-text-tertiary font-caption mt-xs block">
                    {{ 'DASHBOARD.PROFESSOR.ACTIVITY_3_TIME' | translate }}
                  </span>
                </div>
              </div>
            </div>
          </section>
        }
      }
    }
  `,
})
export class DashboardHomeComponent {
  private readonly auth = inject(AuthStateService);
  private readonly currentUser = toSignal(this.auth.currentUser$, { initialValue: null });

  readonly menuRole = computed(() => {
    const user = this.currentUser();
    return user ? resolveShellMenuRole(user.role) : null;
  });

  readonly titleKey = computed(() => {
    const role = this.menuRole();
    return role ? `DASHBOARD.HOME.${role}.TITLE` : 'DASHBOARD.PLACEHOLDER.TITLE';
  });

  readonly subtitleKey = computed(() => {
    const role = this.menuRole();
    return role ? `DASHBOARD.HOME.${role}.SUBTITLE` : 'DASHBOARD.PLACEHOLDER.MESSAGE';
  });

  readonly cards = computed(() => {
    const role = this.menuRole();
    return role ? (DASHBOARD_CARDS_BY_ROLE[role] ?? []) : [];
  });
}
