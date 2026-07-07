import { RoleType } from '../models';

import { ShellMenuRole, ShellNavigation } from './shell-menu.model';

const HOME_LINK = {
  id: 'home',
  labelKey: 'SHELL.MENU.HOME',
  route: '/dashboard',
  icon: 'pi pi-home',
} as const;

const PRESENTATIONS_LINK = {
  id: 'presentations',
  labelKey: 'SHELL.MENU.PRESENTATIONS',
  route: '/presentations',
  icon: 'pi pi-microphone',
} as const;

const STUDENT_NAV: ShellNavigation = {
  home: HOME_LINK,
  sections: [],
};

const PROFESSOR_NAV: ShellNavigation = {
  home: HOME_LINK,
  sections: [
    {
      id: 'professor-enrollment',
      labelKey: 'SHELL.SECTIONS.ENROLLMENT',
      items: [
        {
          id: 'advisor-approval',
          labelKey: 'SHELL.MENU.ADVISOR_APPROVAL',
          route: '/enrollment/advisor-approval',
          icon: 'pi pi-check-square',
        },
      ],
    },
  ],
};

const ASSISTANT_NAV: ShellNavigation = {
  home: HOME_LINK,
  sections: [
    {
      id: 'assistant-enrollment',
      labelKey: 'SHELL.SECTIONS.ENROLLMENT_PROCESS',
      items: [
        {
          id: 'enrollment-form-pdf',
          labelKey: 'SHELL.MENU.ENROLLMENT_FORM_PDF',
          route: '/enrollment/form-pdf',
          icon: 'pi pi-file-pdf',
        },
      ],
    },
  ],
};

const SPEAKER_NAV: ShellNavigation = {
  home: HOME_LINK,
  sections: [
    {
      id: 'speaker-presentations',
      labelKey: 'SHELL.SECTIONS.PRESENTATIONS',
      items: [PRESENTATIONS_LINK],
    },
  ],
};

const COORDINATOR_NAV: ShellNavigation = {
  home: HOME_LINK,
  sections: [
    {
      id: 'coordinator-academic',
      labelKey: 'SHELL.SECTIONS.ACADEMIC_MANAGEMENT',
      items: [
        {
          id: 'students',
          labelKey: 'SHELL.MENU.STUDENTS',
          route: '/academic-catalog/students',
          icon: 'pi pi-users',
        },
        {
          id: 'professors',
          labelKey: 'SHELL.MENU.PROFESSORS',
          route: '/academic-catalog/professors',
          icon: 'pi pi-user-edit',
        },
        {
          id: 'ueas',
          labelKey: 'SHELL.MENU.UEAS',
          route: '/academic-catalog/ueas',
          icon: 'pi pi-book',
        },
      ],
    },
    {
      id: 'coordinator-offering',
      labelKey: 'SHELL.SECTIONS.PLANNING',
      items: [
        {
          id: 'plan-annual',
          labelKey: 'SHELL.MENU.PLAN_ANNUAL',
          route: '/annual-planning',
          icon: 'pi pi-calendar-plus',
        },
        {
          id: 'plan-quarterly',
          labelKey: 'SHELL.MENU.PLAN_QUARTERLY',
          route: '/academic-offering/plan-quarterly',
          icon: 'pi pi-table',
        },
        {
          id: 'enrollment-start',
          labelKey: 'SHELL.MENU.ENROLLMENT_START',
          route: '/academic-offering/enrollment-start',
          icon: 'pi pi-upload',
        },
      ],
    },
    {
      id: 'coordinator-enrollment',
      labelKey: 'SHELL.SECTIONS.ENROLLMENT_PROCESS',
      items: [
        {
          id: 'terms-offer',
          labelKey: 'SHELL.MENU.TERMS_OFFER',
          route: '/enrollment/terms',
          icon: 'pi pi-calendar',
        },
        {
          id: 'enrollment-form-pdf',
          labelKey: 'SHELL.MENU.ENROLLMENT_FORM_PDF',
          route: '/enrollment/form-pdf',
          icon: 'pi pi-file-pdf',
        },
        {
          id: 'enrollment-status',
          labelKey: 'SHELL.MENU.ENROLLMENT_STATUS',
          route: '/enrollment/status',
          icon: 'pi pi-list-check',
        },
      ],
    },
    {
      id: 'coordinator-presentations',
      labelKey: 'SHELL.SECTIONS.PRESENTATIONS',
      items: [PRESENTATIONS_LINK],
    },
  ],
};

const SYSTEM_ADMIN_NAV: ShellNavigation = {
  home: HOME_LINK,
  sections: [
    {
      id: 'system-admin-presentations',
      labelKey: 'SHELL.SECTIONS.PRESENTATIONS',
      items: [PRESENTATIONS_LINK],
    },
  ],
};

const NAV_BY_ROLE: Record<ShellMenuRole, ShellNavigation> = {
  SYSTEM_ADMIN: SYSTEM_ADMIN_NAV,
  STUDENT: STUDENT_NAV,
  PROFESSOR: PROFESSOR_NAV,
  ASSISTANT: ASSISTANT_NAV,
  COORDINATOR: COORDINATOR_NAV,
  SPEAKER: SPEAKER_NAV,
};

export function resolveShellMenuRole(role: RoleType): ShellMenuRole {
  return role;
}

export function getShellNavigation(role: RoleType | null): ShellNavigation | null {
  const menuRole = role ? resolveShellMenuRole(role) : null;
  if (!menuRole) {
    return null;
  }

  return NAV_BY_ROLE[menuRole];
}
