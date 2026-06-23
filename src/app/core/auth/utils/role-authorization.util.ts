import { RoleType } from '../../../models';

export function hasAppProfile(role: RoleType): boolean {
  return Boolean(role);
}

export function matchesAnyRole(userRole: RoleType, allowedRoles: readonly RoleType[]): boolean {
  if (!hasAppProfile(userRole)) {
    return false;
  }

  return allowedRoles.includes(userRole);
}
