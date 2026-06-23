import { Routes } from '@angular/router';

import { guestAuthGuard } from '../../core/auth/guards/guest-auth.guard';

export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestAuthGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
    canActivate: [guestAuthGuard],
  },
  {
    path: 'forgot-password/sent',
    loadComponent: () =>
      import('./forgot-password-sent/forgot-password-sent.component').then(
        (m) => m.ForgotPasswordSentComponent,
      ),
    canActivate: [guestAuthGuard],
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
    canActivate: [guestAuthGuard],
  },
];
