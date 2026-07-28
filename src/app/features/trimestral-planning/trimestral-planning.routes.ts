import { CanDeactivateFn, Routes } from '@angular/router';

import { authGuard } from '../../core/auth/guards/auth.guard';
import { ROUTE_PERMISSIONS } from '../../core/auth/rbac.policy';
import type { TrimestralPlanDetailComponent } from './components/trimestral-plan-detail/trimestral-plan-detail.component';

const planningData = { roles: ROUTE_PERMISSIONS.trimestralPlanning };

/**
 * Llenar un trimestre son decenas de ediciones locales; salir por el breadcrumb las
 * perdía sin avisar. Es el primer `canDeactivate` del repo: tipado al componente, sin
 * interfaz de una sola implementación. Se generaliza a `core/` cuando haya un segundo.
 */
const unsavedChangesGuard: CanDeactivateFn<TrimestralPlanDetailComponent> = (component) =>
  component.canDeactivate();

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
    canDeactivate: [unsavedChangesGuard],
    data: { ...planningData, breadcrumb: 'TRIMESTRAL_PLANNING.DETAIL.BREADCRUMB' },
  },
];
