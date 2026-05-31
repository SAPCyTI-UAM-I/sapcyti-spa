import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthStateService } from '../../../core/auth/auth.service';
import { resolveShellMenuRole } from '../../../shell/shell-menu.config';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

export interface DashboardCard {
  icon: string;
  value: string | number;
  labelKey: string;
  linkKey?: string;
  linkRoute?: string;
  badgeKey?: string;
  iconBgClass: string;
  iconColorClass: string;
  valueColorClass: string;
  linkColorClass: string;
  badgeClass?: string;
}

const COORDINATOR_CARDS: DashboardCard[] = [
  {
    icon: 'pi pi-users',
    value: 47,
    labelKey: 'DASHBOARD.CARDS.STUDENTS_COUNT',
    linkKey: 'DASHBOARD.CARDS.STUDENTS_LINK',
    linkRoute: '/academic-catalog/students',
    iconBgClass: 'bg-primary-container',
    iconColorClass: 'text-primary',
    valueColorClass: 'text-primary',
    linkColorClass: 'text-primary hover:text-primary-hover',
  },
  {
    icon: 'pi pi-user-plus',
    value: 'Trimestre 26-I',
    labelKey: 'DASHBOARD.CARDS.ACTIVE_TERM',
    badgeKey: 'DASHBOARD.CARDS.ACTIVE_TERM_BADGE',
    linkKey: 'DASHBOARD.CARDS.MANAGE_LINK',
    linkRoute: '/enrollment/terms',
    iconBgClass: 'bg-secondary-container',
    iconColorClass: 'text-secondary',
    valueColorClass: 'text-on-surface',
    linkColorClass: 'text-secondary hover:text-on-secondary-container',
    badgeClass: 'bg-secondary-container text-on-secondary-container',
  },
  {
    icon: 'pi pi-clock',
    value: 8,
    labelKey: 'DASHBOARD.CARDS.PENDING_APPROVAL',
    linkKey: 'DASHBOARD.CARDS.PENDING_LINK',
    linkRoute: '/enrollment/advisor-approval',
    iconBgClass: 'bg-warning-container',
    iconColorClass: 'text-warning',
    valueColorClass: 'text-warning',
    linkColorClass: 'text-warning hover:text-warning-strong',
  },
  {
    icon: 'pi pi-print',
    value: 3,
    labelKey: 'DASHBOARD.CARDS.FORMATS_READY',
    linkKey: 'DASHBOARD.CARDS.FORMATS_LINK',
    linkRoute: '/enrollment/form-pdf',
    iconBgClass: 'bg-info-container',
    iconColorClass: 'text-info',
    valueColorClass: 'text-info',
    linkColorClass: 'text-info hover:text-info-strong',
  },
];

const STUDENT_CARDS: DashboardCard[] = [
  {
    icon: 'pi pi-bookmark',
    value: 'Trimestre 26-I',
    labelKey: 'DASHBOARD.CARDS.MY_ENROLLMENT',
    linkKey: 'DASHBOARD.CARDS.MY_ENROLLMENT_LINK',
    linkRoute: '/enrollment',
    iconBgClass: 'bg-primary-container',
    iconColorClass: 'text-primary',
    valueColorClass: 'text-primary',
    linkColorClass: 'text-primary hover:text-primary-hover',
  },
];

const PROFESSOR_CARDS: DashboardCard[] = [
  {
    icon: 'pi pi-users',
    value: 12,
    labelKey: 'DASHBOARD.CARDS.MY_ADVISEES',
    linkKey: 'DASHBOARD.CARDS.MY_ADVISEES_LINK',
    linkRoute: '/enrollment/advisor-approval',
    iconBgClass: 'bg-primary-container',
    iconColorClass: 'text-primary',
    valueColorClass: 'text-primary',
    linkColorClass: 'text-primary hover:text-primary-hover',
  },
  {
    icon: 'pi pi-clock',
    value: 3,
    labelKey: 'DASHBOARD.CARDS.PENDING_REVIEWS',
    linkKey: 'DASHBOARD.CARDS.PENDING_REVIEWS_LINK',
    linkRoute: '/enrollment/advisor-approval',
    iconBgClass: 'bg-warning-container',
    iconColorClass: 'text-warning',
    valueColorClass: 'text-warning',
    linkColorClass: 'text-warning hover:text-warning-strong',
  },
];

const ASSISTANT_CARDS: DashboardCard[] = [
  {
    icon: 'pi pi-print',
    value: 6,
    labelKey: 'DASHBOARD.CARDS.SUPPORT_FORMATS',
    linkKey: 'DASHBOARD.CARDS.SUPPORT_FORMATS_LINK',
    linkRoute: '/enrollment/form-pdf',
    iconBgClass: 'bg-primary-container',
    iconColorClass: 'text-primary',
    valueColorClass: 'text-primary',
    linkColorClass: 'text-primary hover:text-primary-hover',
  },
];

const PRESENTATION_CARDS: DashboardCard[] = [
  {
    icon: 'pi pi-microphone',
    value: '26-I',
    labelKey: 'DASHBOARD.CARDS.PRESENTATIONS',
    linkKey: 'DASHBOARD.CARDS.PRESENTATIONS_LINK',
    linkRoute: '/presentations',
    iconBgClass: 'bg-primary-container',
    iconColorClass: 'text-primary',
    valueColorClass: 'text-primary',
    linkColorClass: 'text-primary hover:text-primary-hover',
  },
];

const CARDS_BY_ROLE: Record<string, DashboardCard[]> = {
  COORDINATOR: COORDINATOR_CARDS,
  STUDENT: STUDENT_CARDS,
  PROFESSOR: PROFESSOR_CARDS,
  ASSISTANT: ASSISTANT_CARDS,
  SPEAKER: PRESENTATION_CARDS,
  SYSTEM_ADMIN: PRESENTATION_CARDS,
};

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
        <section class="bg-surface border-outline gap-lg p-lg flex flex-col rounded-xl border">
          <div class="border-surface-subtle pb-sm flex items-center justify-between border-b">
            <h2 class="text-h3 text-on-surface font-h3 gap-sm flex items-center">
              <i class="pi pi-graduation-cap text-primary" aria-hidden="true"></i>
              {{ 'DASHBOARD.STUDENT.ENROLLMENT_TITLE' | translate }}
            </h2>
          </div>

          <div class="gap-xl flex flex-col items-start justify-between md:flex-row md:items-center">
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
              class="bg-surface-subtle gap-md p-md flex w-full flex-col rounded-lg md:w-[360px] md:shrink-0 md:items-end md:bg-transparent md:p-0"
            >
              <div
                class="border-warning/30 bg-warning/10 text-warning gap-sm px-md py-xs flex items-center rounded-full border"
              >
                <i class="pi pi-clock text-[18px]" aria-hidden="true"></i>
                <span class="text-label-md font-label-md font-bold">
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
          <div class="gap-md grid grid-cols-1 md:grid-cols-2">
            <div
              class="bg-surface border-outline p-md flex items-center justify-between rounded-lg border opacity-75"
            >
              <div
                class="border-info/30 bg-info/10 text-info gap-sm px-md py-xs flex items-center rounded-full border"
              >
                <i class="pi pi-hourglass text-[18px]" aria-hidden="true"></i>
                <span class="text-label-md font-label-md font-bold">
                  {{ 'DASHBOARD.STUDENT.PENDING_REVIEW' | translate }}
                </span>
              </div>
              <span class="text-caption text-text-tertiary font-caption">
                {{ 'DASHBOARD.STUDENT.PHASE_2' | translate }}
              </span>
            </div>
            <div
              class="bg-surface border-outline p-md flex items-center justify-between rounded-lg border opacity-75"
            >
              <div
                class="border-success/30 bg-success/10 text-success gap-sm px-md py-xs flex items-center rounded-full border"
              >
                <i class="pi pi-check-circle text-[18px]" aria-hidden="true"></i>
                <span class="text-label-md font-label-md font-bold">
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
        <div class="gap-gutter lg:gap-margin grid grid-cols-1 md:grid-cols-2">
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
          <section class="bg-surface border-outline mt-lg overflow-hidden rounded-xl border">
            <div class="bg-table-header border-outline px-lg py-sm border-b">
              <h2 class="text-h2 text-on-surface font-h2">
                {{ 'DASHBOARD.PROFESSOR.ACTIVITY_TITLE' | translate }}
              </h2>
            </div>
            <div class="divide-sidebar-border divide-y">
              <div class="hover:bg-surface-subtle gap-md p-md flex items-start transition-colors">
                <div
                  class="bg-info/10 text-info mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                >
                  <i class="pi pi-send text-[18px]" aria-hidden="true"></i>
                </div>
                <div class="flex-1">
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
              <div class="hover:bg-surface-subtle gap-md p-md flex items-start transition-colors">
                <div
                  class="bg-success/10 text-success mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                >
                  <i class="pi pi-check-circle text-[18px]" aria-hidden="true"></i>
                </div>
                <div class="flex-1">
                  <p class="text-body-md text-on-surface font-body-md">
                    {{ 'DASHBOARD.PROFESSOR.ACTIVITY_2' | translate }}
                  </p>
                  <span class="text-caption text-text-tertiary font-caption mt-xs block">
                    {{ 'DASHBOARD.PROFESSOR.ACTIVITY_2_TIME' | translate }}
                  </span>
                </div>
              </div>
              <div class="hover:bg-surface-subtle gap-md p-md flex items-start transition-colors">
                <div
                  class="bg-surface-container-highest text-text-secondary mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                >
                  <i class="pi pi-upload text-[18px]" aria-hidden="true"></i>
                </div>
                <div class="flex-1">
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
    return role ? (CARDS_BY_ROLE[role] ?? []) : [];
  });
}
