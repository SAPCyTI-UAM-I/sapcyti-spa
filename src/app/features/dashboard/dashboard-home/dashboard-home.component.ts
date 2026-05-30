import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
    iconBgClass: 'bg-primary/10',
    iconColorClass: 'text-primary',
    valueColorClass: 'text-primary',
    linkColorClass: 'text-primary hover:text-primary/80',
  },
  {
    icon: 'pi pi-check-circle',
    value: 'Trimestre 26-I',
    labelKey: 'DASHBOARD.CARDS.ACTIVE_TERM',
    badgeKey: 'DASHBOARD.CARDS.ACTIVE_TERM_BADGE',
    linkKey: 'DASHBOARD.CARDS.MANAGE_LINK',
    linkRoute: '/enrollment/terms',
    iconBgClass: 'bg-teal-100',
    iconColorClass: 'text-teal-700',
    valueColorClass: 'text-surface-700',
    linkColorClass: 'text-teal-700 hover:text-teal-800',
    badgeClass: 'bg-teal-100 text-teal-700',
  },
  {
    icon: 'pi pi-clock',
    value: 8,
    labelKey: 'DASHBOARD.CARDS.PENDING_APPROVAL',
    linkKey: 'DASHBOARD.CARDS.PENDING_LINK',
    linkRoute: '/enrollment/advisor-approval',
    iconBgClass: 'bg-amber-100',
    iconColorClass: 'text-amber-600',
    valueColorClass: 'text-amber-600',
    linkColorClass: 'text-amber-600 hover:text-amber-700',
  },
  {
    icon: 'pi pi-print',
    value: 3,
    labelKey: 'DASHBOARD.CARDS.FORMATS_READY',
    linkKey: 'DASHBOARD.CARDS.FORMATS_LINK',
    linkRoute: '/enrollment/form-pdf',
    iconBgClass: 'bg-blue-100',
    iconColorClass: 'text-blue-600',
    valueColorClass: 'text-blue-600',
    linkColorClass: 'text-blue-600 hover:text-blue-700',
  },
];

const STUDENT_CARDS: DashboardCard[] = [
  {
    icon: 'pi pi-bookmark',
    value: 'Trimestre 26-I',
    labelKey: 'DASHBOARD.CARDS.MY_ENROLLMENT',
    linkKey: 'DASHBOARD.CARDS.MY_ENROLLMENT_LINK',
    linkRoute: '/enrollment',
    iconBgClass: 'bg-primary/10',
    iconColorClass: 'text-primary',
    valueColorClass: 'text-primary',
    linkColorClass: 'text-primary hover:text-primary/80',
  },
];

const PROFESSOR_CARDS: DashboardCard[] = [
  {
    icon: 'pi pi-users',
    value: 12,
    labelKey: 'DASHBOARD.CARDS.MY_ADVISEES',
    linkKey: 'DASHBOARD.CARDS.MY_ADVISEES_LINK',
    linkRoute: '/enrollment/advisor-approval',
    iconBgClass: 'bg-primary/10',
    iconColorClass: 'text-primary',
    valueColorClass: 'text-primary',
    linkColorClass: 'text-primary hover:text-primary/80',
  },
  {
    icon: 'pi pi-clock',
    value: 5,
    labelKey: 'DASHBOARD.CARDS.PENDING_REVIEWS',
    linkKey: 'DASHBOARD.CARDS.PENDING_REVIEWS_LINK',
    linkRoute: '/enrollment/advisor-approval',
    iconBgClass: 'bg-amber-100',
    iconColorClass: 'text-amber-600',
    valueColorClass: 'text-amber-600',
    linkColorClass: 'text-amber-600 hover:text-amber-700',
  },
];

const ASSISTANT_CARDS: DashboardCard[] = [
  {
    icon: 'pi pi-print',
    value: 6,
    labelKey: 'DASHBOARD.CARDS.SUPPORT_FORMATS',
    linkKey: 'DASHBOARD.CARDS.SUPPORT_FORMATS_LINK',
    linkRoute: '/enrollment/form-pdf',
    iconBgClass: 'bg-blue-100',
    iconColorClass: 'text-blue-600',
    valueColorClass: 'text-blue-600',
    linkColorClass: 'text-blue-600 hover:text-blue-700',
  },
];

const CARDS_BY_ROLE: Record<string, DashboardCard[]> = {
  COORDINATOR: COORDINATOR_CARDS,
  STUDENT: STUDENT_CARDS,
  PROFESSOR: PROFESSOR_CARDS,
  ASSISTANT: ASSISTANT_CARDS,
};

@Component({
  selector: 'app-dashboard-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, StatCardComponent],
  template: `
    <div class="mb-6">
      <h1 class="text-surface-900 text-2xl font-semibold">
        {{ titleKey() | translate }}
      </h1>
      <p class="text-surface-500 mt-1 text-sm">
        {{ subtitleKey() | translate }}
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
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
