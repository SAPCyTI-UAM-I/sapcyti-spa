import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
        canActivate: [authGuard],
      },
      {
        path: 'enrollment',
        loadChildren: () =>
          import('./features/enrollment/enrollment.routes').then((m) => m.ENROLLMENT_ROUTES),
        canActivate: [authGuard],
        data: {
          roles: ['STUDENT', 'PROFESSOR', 'COORDINATOR', 'ASSISTANT', 'SYSTEM_ADMIN'],
        },
      },
      {
        path: 'academic-catalog',
        loadChildren: () =>
          import('./features/academic-catalog/academic-catalog.routes').then(
            (m) => m.ACADEMIC_CATALOG_ROUTES,
          ),
        canActivate: [authGuard],
        data: {
          roles: ['COORDINATOR', 'ASSISTANT', 'SYSTEM_ADMIN'],
        },
      },
      {
        path: 'access-denied',
        loadComponent: () =>
          import('./shared/components/access-denied/access-denied.component').then(
            (m) => m.AccessDeniedComponent,
          ),
      },
    ],
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
