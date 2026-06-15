import { ACCOUNT_ROUTES } from './account.routes';
import { ROUTE_PERMISSIONS } from '../../core/auth/rbac.policy';

describe('ACCOUNT_ROUTES', () => {
  it('allows all authenticated roles in self mode', () => {
    expect(ACCOUNT_ROUTES[0]?.data?.['roles']).toEqual(ROUTE_PERMISSIONS.account);
  });

  it('restricts administrative mode to coordinators', () => {
    expect(ACCOUNT_ROUTES[1]?.path).toBe('users/:userId/password');
    expect(ACCOUNT_ROUTES[1]?.data?.['roles']).toEqual(['COORDINATOR']);
  });
});
