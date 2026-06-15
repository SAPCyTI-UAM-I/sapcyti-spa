import { ACCOUNT_ROUTES } from './account.routes';
import { ROUTE_PERMISSIONS } from '../../core/auth/rbac.policy';

const routeFor = (path: string) => ACCOUNT_ROUTES.find((route) => route.path === path);

describe('ACCOUNT_ROUTES', () => {
  it('allows all authenticated roles in self mode', () => {
    expect(routeFor('password')?.data?.['roles']).toEqual(ROUTE_PERMISSIONS.account);
  });

  it('restricts administrative mode to coordinators', () => {
    expect(routeFor('users/:userId/password')?.data?.['roles']).toEqual(['COORDINATOR']);
  });

  it('redirects the bare account path to the not-found page', () => {
    expect(routeFor('')?.redirectTo).toBe('/not-found');
  });
});
