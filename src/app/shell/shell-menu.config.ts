import { RoleType } from '../models/role-type.model';

import { ShellMenuRole, ShellNavigation } from './shell-menu.model';

const HOME_LINK = {
  id: 'home',
  labelKey: 'SHELL.MENU.HOME',
  route: '/dashboard',
  icon: 'pi pi-home',
} as const;

const STUDENT_NAV: ShellNavigation = {
  home: HOME_LINK,
  sections: [
    {
      id: 'student-main',
      labelKey: 'SHELL.SECTIONS.MAIN',
      items: [
        {
          id: 'enrollment',
          labelKey: 'SHELL.MENU.ENROLLMENT',
          route: '/enrollment',
          icon: 'pi pi-user-plus',
        },
      ],
    },
  ],
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
  ],
};

const NAV_BY_ROLE: Record<ShellMenuRole, ShellNavigation> = {
  STUDENT: STUDENT_NAV,
  PROFESSOR: PROFESSOR_NAV,
  ASSISTANT: ASSISTANT_NAV,
  COORDINATOR: COORDINATOR_NAV,
};

export function resolveShellMenuRole(role: RoleType): ShellMenuRole | null {
  if (role === 'SPEAKER') {
    return null;
  }

  if (role === 'SYSTEM_ADMIN') {
    return 'COORDINATOR';
  }

  return role;
}

export function getShellNavigation(role: RoleType | null): ShellNavigation | null {
  const menuRole = role ? resolveShellMenuRole(role) : null;
  if (!menuRole) {
    return null;
  }

  return NAV_BY_ROLE[menuRole];
}
