export const ROLE_TYPES = [
  'SYSTEM_ADMIN',
  'COORDINATOR',
  'ASSISTANT',
  'PROFESSOR',
  'STUDENT',
  'SPEAKER',
] as const;

export type RoleType = (typeof ROLE_TYPES)[number];

export function isRoleType(value: string): value is RoleType {
  return (ROLE_TYPES as readonly string[]).includes(value);
}
