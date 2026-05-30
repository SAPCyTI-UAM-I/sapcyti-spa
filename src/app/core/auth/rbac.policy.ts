import { RoleType } from '../../models/role-type.model';

/**
 * Mirrors the effective backend RBAC today:
 * Spring grants one ROLE_* authority from the JWT and @PreAuthorize has no RoleHierarchy bean.
 */
export const ROUTE_PERMISSIONS = {
  dashboard: ['SYSTEM_ADMIN', 'COORDINATOR', 'ASSISTANT', 'PROFESSOR', 'STUDENT'],
  enrollment: ['COORDINATOR', 'ASSISTANT', 'PROFESSOR', 'STUDENT'],
  advisorApproval: ['PROFESSOR'],
  enrollmentFormPdf: ['COORDINATOR', 'ASSISTANT'],
  enrollmentTerms: ['COORDINATOR'],
  enrollmentStatus: ['COORDINATOR'],
  academicCatalog: ['COORDINATOR'],
} as const satisfies Record<string, readonly RoleType[]>;

export type RoutePermissionKey = keyof typeof ROUTE_PERMISSIONS;
