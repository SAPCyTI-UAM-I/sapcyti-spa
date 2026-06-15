import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { RoleType } from '../../../models';
import { AuthStateService } from '../auth.service';
import { hasAppProfile, matchesAnyRole } from '../utils/role-authorization.util';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthStateService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  const user = auth.getCurrentUser();
  if (!user || !hasAppProfile(user.role)) {
    return router.createUrlTree(['/access-denied']);
  }

  const allowedRoles = route.data['roles'] as RoleType[] | undefined;
  if (allowedRoles?.length && !matchesAnyRole(user.role, allowedRoles)) {
    return router.createUrlTree(['/access-denied']);
  }

  return true;
};
