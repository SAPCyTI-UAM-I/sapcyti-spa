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

export const DASHBOARD_CARDS_BY_ROLE: Record<string, DashboardCard[]> = {
  COORDINATOR: COORDINATOR_CARDS,
  STUDENT: STUDENT_CARDS,
  PROFESSOR: PROFESSOR_CARDS,
  ASSISTANT: ASSISTANT_CARDS,
  SPEAKER: PRESENTATION_CARDS,
  SYSTEM_ADMIN: PRESENTATION_CARDS,
};
