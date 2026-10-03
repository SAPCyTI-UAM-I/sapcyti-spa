import { CardTone } from '../../shared/components';
import { RoleType } from '../../models';

export interface DashboardCard {
  icon: string;
  value: string | number;
  labelKey: string;
  linkKey?: string;
  linkRoute?: string;
  badgeKey?: string;
  tone: CardTone;
}

/**
 * CardTone mapping (presentation lives in StatCardComponent TONE_CLASSES):
 * - primary: bg-primary-container / text-primary / text-primary / text-primary hover:text-primary-hover
 * - secondary: bg-secondary-container / text-secondary / text-on-surface / text-secondary hover:text-on-secondary-container (+ badge)
 * - warning: bg-warning-container / text-warning / text-warning / text-warning hover:text-warning-strong
 * - info: bg-info-container / text-info / text-info / text-info hover:text-info-strong
 */

const COORDINATOR_CARDS: DashboardCard[] = [
  {
    icon: 'pi pi-users',
    value: 47,
    labelKey: 'DASHBOARD.CARDS.STUDENTS_COUNT',
    linkKey: 'DASHBOARD.CARDS.STUDENTS_LINK',
    linkRoute: '/academic-catalog/students',
    tone: 'primary',
  },
  {
    icon: 'pi pi-clock',
    value: 8,
    labelKey: 'DASHBOARD.CARDS.PENDING_APPROVAL',
    linkKey: 'DASHBOARD.CARDS.PENDING_LINK',
    linkRoute: '/enrollment/advisor-approval',
    tone: 'warning',
  },
];

const STUDENT_CARDS: DashboardCard[] = [
  {
    icon: 'pi pi-bookmark',
    value: 'Trimestre 26-I',
    labelKey: 'DASHBOARD.CARDS.MY_ENROLLMENT',
    tone: 'primary',
  },
];

const PROFESSOR_CARDS: DashboardCard[] = [
  {
    icon: 'pi pi-users',
    value: 12,
    labelKey: 'DASHBOARD.CARDS.MY_ADVISEES',
    linkKey: 'DASHBOARD.CARDS.MY_ADVISEES_LINK',
    linkRoute: '/enrollment/advisor-approval',
    tone: 'primary',
  },
  {
    icon: 'pi pi-clock',
    value: 3,
    labelKey: 'DASHBOARD.CARDS.PENDING_REVIEWS',
    linkKey: 'DASHBOARD.CARDS.PENDING_REVIEWS_LINK',
    linkRoute: '/enrollment/advisor-approval',
    tone: 'warning',
  },
];

const EMPTY_CARDS: DashboardCard[] = [];

export const DASHBOARD_CARDS_BY_ROLE: Record<RoleType, DashboardCard[]> = {
  COORDINATOR: COORDINATOR_CARDS,
  STUDENT: STUDENT_CARDS,
  PROFESSOR: PROFESSOR_CARDS,
  ASSISTANT: EMPTY_CARDS,
  SPEAKER: EMPTY_CARDS,
  SYSTEM_ADMIN: EMPTY_CARDS,
};
