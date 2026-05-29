import { RoleType } from '../../models/role-type.model';

export function hasAppProfile(role: RoleType): boolean {
  return role !== 'SPEAKER';
}

export function matchesAnyRole(userRole: RoleType, allowedRoles: readonly RoleType[]): boolean {
  if (!hasAppProfile(userRole)) {
    return false;
  }

  if (userRole === 'SYSTEM_ADMIN') {
    return allowedRoles.includes('SYSTEM_ADMIN') || allowedRoles.includes('COORDINATOR');
  }

  return allowedRoles.includes(userRole);
}
