import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStateService } from './auth.service';
import { hasAppProfile } from './role-authorization.util';

export const guestAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthStateService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  const user = auth.getCurrentUser();
  if (!user || !hasAppProfile(user.role)) {
    return router.createUrlTree(['/access-denied']);
  }

  return router.createUrlTree(['/dashboard']);
};
