import { RoleType } from '../../models/role-type.model';
import { hasAppProfile, matchesAnyRole } from './role-authorization.util';

describe('role-authorization.util', () => {
  it('hasAppProfile returns false for SPEAKER', () => {
    expect(hasAppProfile('SPEAKER')).toBe(false);
  });

  it('hasAppProfile returns true for other roles', () => {
    expect(hasAppProfile('STUDENT')).toBe(true);
    expect(hasAppProfile('SYSTEM_ADMIN')).toBe(true);
  });

  it('matchesAnyRole grants SYSTEM_ADMIN access to COORDINATOR routes', () => {
    const allowed: RoleType[] = ['COORDINATOR', 'ASSISTANT'];
    expect(matchesAnyRole('SYSTEM_ADMIN', allowed)).toBe(true);
  });

  it('matchesAnyRole denies SPEAKER for any route', () => {
    const allowed: RoleType[] = ['STUDENT', 'COORDINATOR'];
    expect(matchesAnyRole('SPEAKER', allowed)).toBe(false);
  });

  it('matchesAnyRole checks exact role membership', () => {
    expect(matchesAnyRole('STUDENT', ['STUDENT'])).toBe(true);
    expect(matchesAnyRole('STUDENT', ['COORDINATOR'])).toBe(false);
  });
});
