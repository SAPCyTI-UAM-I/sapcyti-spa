import { Routes } from '@angular/router';

import { authGuard } from '../../core/auth/guards/auth.guard';
import { ROUTE_PERMISSIONS } from '../../core/auth/rbac.policy';

export const ACCOUNT_ROUTES: Routes = [
  {
    path: 'password',
    loadComponent: () =>
      import('./password-change/password-change.component').then((m) => m.PasswordChangeComponent),
    canActivate: [authGuard],
    data: { roles: ROUTE_PERMISSIONS.account, breadcrumb: 'BREADCRUMB.PASSWORD' },
  },
  {
    path: 'users/:userId/password',
    loadComponent: () =>
      import('./password-change/password-change.component').then((m) => m.PasswordChangeComponent),
    canActivate: [authGuard],
    data: {
      roles: ROUTE_PERMISSIONS.passwordAdministration,
      breadcrumb: 'BREADCRUMB.PASSWORD',
    },
  },
];
