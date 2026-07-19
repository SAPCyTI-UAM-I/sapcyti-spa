import { Routes } from '@angular/router';

import { authGuard } from '../../core/auth/guards/auth.guard';
import { ROUTE_PERMISSIONS } from '../../core/auth/rbac.policy';

const planningData = { roles: ROUTE_PERMISSIONS.trimestralPlanning };

export const TRIMESTRAL_PLANNING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/trimestral-plan-list/trimestral-plan-list.component').then(
        (m) => m.TrimestralPlanListComponent,
      ),
    canActivate: [authGuard],
    data: planningData,
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/trimestral-plan-new/trimestral-plan-new.component').then(
        (m) => m.TrimestralPlanNewComponent,
      ),
    canActivate: [authGuard],
    data: { ...planningData, breadcrumb: 'BREADCRUMB.NEW' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/trimestral-plan-detail/trimestral-plan-detail.component').then(
        (m) => m.TrimestralPlanDetailComponent,
      ),
    canActivate: [authGuard],
    data: { ...planningData, breadcrumb: 'TRIMESTRAL_PLANNING.DETAIL.BREADCRUMB' },
  },
];
