import { RoleType } from '../../../models/role-type.model';
import { hasAppProfile, matchesAnyRole } from './role-authorization.util';

describe('role-authorization.util', () => {
  it('hasAppProfile returns true for SPEAKER', () => {
    expect(hasAppProfile('SPEAKER')).toBe(true);
  });

  it('hasAppProfile returns true for other roles', () => {
    expect(hasAppProfile('STUDENT')).toBe(true);
    expect(hasAppProfile('SYSTEM_ADMIN')).toBe(true);
  });

  it('matchesAnyRole checks SYSTEM_ADMIN exactly like the backend effective authority', () => {
    const allowed: RoleType[] = ['COORDINATOR', 'ASSISTANT'];
    expect(matchesAnyRole('SYSTEM_ADMIN', allowed)).toBe(false);
    expect(matchesAnyRole('SYSTEM_ADMIN', ['SYSTEM_ADMIN'])).toBe(true);
  });

  it('matchesAnyRole allows SPEAKER when the route explicitly includes it', () => {
    const allowed: RoleType[] = ['SPEAKER', 'COORDINATOR'];
    expect(matchesAnyRole('SPEAKER', allowed)).toBe(true);
    expect(matchesAnyRole('SPEAKER', ['COORDINATOR'])).toBe(false);
  });

  it('matchesAnyRole checks exact role membership', () => {
    expect(matchesAnyRole('STUDENT', ['STUDENT'])).toBe(true);
    expect(matchesAnyRole('STUDENT', ['COORDINATOR'])).toBe(false);
  });
});
