import { Routes } from '@angular/router';

import { guestAuthGuard } from '../../core/auth/guest-auth.guard';

export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestAuthGuard],
  },
];
