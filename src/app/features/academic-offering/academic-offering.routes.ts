import { Routes } from '@angular/router';

import { authGuard } from '../../core/auth/guards/auth.guard';
import { ROUTE_PERMISSIONS } from '../../core/auth/rbac.policy';

const offeringData = { roles: ROUTE_PERMISSIONS.academicOffering };

export const ACADEMIC_OFFERING_ROUTES: Routes = [
  {
    // Academic offering has no landing of its own — only its children are reachable.
    path: '',
    redirectTo: '/not-found',
    pathMatch: 'full',
  },
  {
    // HU-05 — Editar plan trimestral.
    path: 'plan-quarterly',
    loadComponent: () =>
      import('./components/plan-quarterly/plan-quarterly.component').then(
        (m) => m.PlanQuarterlyComponent,
      ),
    canActivate: [authGuard],
    data: { ...offeringData, breadcrumb: 'SHELL.MENU.PLAN_QUARTERLY' },
  },
  {
    // HU-06 — Inicio del proceso de inscripción y carga de horarios.
    path: 'enrollment-start',
    loadComponent: () =>
      import('./components/enrollment-start/enrollment-start.component').then(
        (m) => m.EnrollmentStartComponent,
      ),
    canActivate: [authGuard],
    data: { ...offeringData, breadcrumb: 'SHELL.MENU.ENROLLMENT_START' },
  },
];
