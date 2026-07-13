import { RoleType } from '../../models';

/**
 * Mirrors the effective backend RBAC today:
 * Spring grants one ROLE_* authority from the JWT and @PreAuthorize has no RoleHierarchy bean.
 */
export const ROUTE_PERMISSIONS = {
  dashboard: ['SYSTEM_ADMIN', 'COORDINATOR', 'ASSISTANT', 'PROFESSOR', 'STUDENT', 'SPEAKER'],
  enrollment: ['COORDINATOR', 'ASSISTANT', 'PROFESSOR', 'STUDENT'],
  advisorApproval: ['PROFESSOR'],
  enrollmentFormPdf: ['COORDINATOR', 'ASSISTANT'],
  enrollmentTerms: ['COORDINATOR'],
  enrollmentStatus: ['COORDINATOR'],
  academicCatalog: ['COORDINATOR'],
  academicOffering: ['COORDINATOR'],
  annualPlanning: ['COORDINATOR'],
  enrollmentSurvey: ['COORDINATOR'],
  enrollmentSurveyResponse: ['STUDENT'],
  account: ['SYSTEM_ADMIN', 'COORDINATOR', 'ASSISTANT', 'PROFESSOR', 'STUDENT', 'SPEAKER'],
  passwordAdministration: ['COORDINATOR'],
  presentations: ['SYSTEM_ADMIN', 'COORDINATOR', 'SPEAKER'],
} as const satisfies Record<string, readonly RoleType[]>;

export type RoutePermissionKey = keyof typeof ROUTE_PERMISSIONS;
