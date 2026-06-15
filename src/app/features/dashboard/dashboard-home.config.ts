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
    icon: 'pi pi-user-plus',
    value: 'Trimestre 26-I',
    labelKey: 'DASHBOARD.CARDS.ACTIVE_TERM',
    badgeKey: 'DASHBOARD.CARDS.ACTIVE_TERM_BADGE',
    linkKey: 'DASHBOARD.CARDS.MANAGE_LINK',
    linkRoute: '/enrollment/terms',
    tone: 'secondary',
  },
  {
    icon: 'pi pi-clock',
    value: 8,
    labelKey: 'DASHBOARD.CARDS.PENDING_APPROVAL',
    linkKey: 'DASHBOARD.CARDS.PENDING_LINK',
    linkRoute: '/enrollment/advisor-approval',
    tone: 'warning',
  },
  {
    icon: 'pi pi-print',
    value: 3,
    labelKey: 'DASHBOARD.CARDS.FORMATS_READY',
    linkKey: 'DASHBOARD.CARDS.FORMATS_LINK',
    linkRoute: '/enrollment/form-pdf',
    tone: 'info',
  },
];

const STUDENT_CARDS: DashboardCard[] = [
  {
    icon: 'pi pi-bookmark',
    value: 'Trimestre 26-I',
    labelKey: 'DASHBOARD.CARDS.MY_ENROLLMENT',
    linkKey: 'DASHBOARD.CARDS.MY_ENROLLMENT_LINK',
    linkRoute: '/enrollment',
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

const ASSISTANT_CARDS: DashboardCard[] = [
  {
    icon: 'pi pi-print',
    value: 6,
    labelKey: 'DASHBOARD.CARDS.SUPPORT_FORMATS',
    linkKey: 'DASHBOARD.CARDS.SUPPORT_FORMATS_LINK',
    linkRoute: '/enrollment/form-pdf',
    tone: 'primary',
  },
];

const PRESENTATION_CARDS: DashboardCard[] = [
  {
    icon: 'pi pi-microphone',
    value: '26-I',
    labelKey: 'DASHBOARD.CARDS.PRESENTATIONS',
    linkKey: 'DASHBOARD.CARDS.PRESENTATIONS_LINK',
    linkRoute: '/presentations',
    tone: 'primary',
  },
];

export const DASHBOARD_CARDS_BY_ROLE: Record<RoleType, DashboardCard[]> = {
  COORDINATOR: COORDINATOR_CARDS,
  STUDENT: STUDENT_CARDS,
  PROFESSOR: PROFESSOR_CARDS,
  ASSISTANT: ASSISTANT_CARDS,
  SPEAKER: PRESENTATION_CARDS,
  SYSTEM_ADMIN: PRESENTATION_CARDS,
};
