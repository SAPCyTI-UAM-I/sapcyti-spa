import { Routes } from '@angular/router';

import { authGuard } from '../../core/auth/guards/auth.guard';
import { ROUTE_PERMISSIONS } from '../../core/auth/rbac.policy';

const planningData = { roles: ROUTE_PERMISSIONS.annualPlanning };

export const ANNUAL_PLANNING_ROUTES: Routes = [
  {
    // HU-50 — listado de planeaciones.
    path: '',
    loadComponent: () =>
      import('./components/annual-plan-list/annual-plan-list.component').then(
        (m) => m.AnnualPlanListComponent,
      ),
    canActivate: [authGuard],
    data: planningData,
  },
  {
    // HU-49 — wizard de creación con chequeo del archivo.
    path: 'new',
    loadComponent: () =>
      import('./components/annual-plan-wizard/annual-plan-wizard.component').then(
        (m) => m.AnnualPlanWizardComponent,
      ),
    canActivate: [authGuard],
    data: { ...planningData, breadcrumb: 'BREADCRUMB.NEW' },
  },
  {
    // HU-50/51/52/53 — consulta, llenado, descarga y ciclo de estados.
    path: ':year',
    loadComponent: () =>
      import('./components/annual-plan-detail/annual-plan-detail.component').then(
        (m) => m.AnnualPlanDetailComponent,
      ),
    canActivate: [authGuard],
    data: { ...planningData, breadcrumb: 'ANNUAL_PLANNING.DETAIL.BREADCRUMB' },
  },
];
