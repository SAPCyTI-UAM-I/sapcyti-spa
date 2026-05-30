import { Routes } from '@angular/router';

import { authGuard } from './core/auth/guards/auth.guard';
import { ROUTE_PERMISSIONS } from './core/auth/rbac.policy';

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
        data: {
          roles: ROUTE_PERMISSIONS.dashboard,
        },
      },
      {
        path: 'enrollment',
        loadChildren: () =>
          import('./features/enrollment/enrollment.routes').then((m) => m.ENROLLMENT_ROUTES),
        canActivate: [authGuard],
        data: {
          roles: ROUTE_PERMISSIONS.enrollment,
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
          roles: ROUTE_PERMISSIONS.academicCatalog,
        },
      },
      {
        path: 'presentations',
        loadChildren: () =>
          import('./features/presentations/presentations.routes').then(
            (m) => m.PRESENTATIONS_ROUTES,
          ),
        canActivate: [authGuard],
        data: {
          roles: ROUTE_PERMISSIONS.presentations,
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
