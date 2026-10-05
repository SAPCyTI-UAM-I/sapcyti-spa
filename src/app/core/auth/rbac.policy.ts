import { RoleType } from '../../models';

/**
 * Mirrors the effective backend RBAC today:
 * Spring grants one ROLE_* authority from the JWT and @PreAuthorize has no RoleHierarchy bean.
 */
export const ROUTE_PERMISSIONS = {
  dashboard: ['SYSTEM_ADMIN', 'COORDINATOR', 'ASSISTANT', 'PROFESSOR', 'STUDENT', 'SPEAKER'],
  enrollment: ['COORDINATOR', 'PROFESSOR', 'STUDENT'],
  advisorApproval: ['PROFESSOR'],
  academicCatalog: ['COORDINATOR'],
  annualPlanning: ['COORDINATOR'],
  trimestralPlanning: ['COORDINATOR'],
  enrollmentSurvey: ['COORDINATOR'],
  enrollmentSurveyResponse: ['STUDENT'],
  studentProfile: ['STUDENT'],
  account: ['SYSTEM_ADMIN', 'COORDINATOR', 'ASSISTANT', 'PROFESSOR', 'STUDENT', 'SPEAKER'],
  passwordAdministration: ['COORDINATOR'],
} as const satisfies Record<string, readonly RoleType[]>;

export type RoutePermissionKey = keyof typeof ROUTE_PERMISSIONS;
