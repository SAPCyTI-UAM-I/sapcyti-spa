import { Routes } from '@angular/router';

import { authGuard } from '../../core/auth/guards/auth.guard';
import { ROUTE_PERMISSIONS } from '../../core/auth/rbac.policy';
export const ACADEMIC_CATALOG_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'students',
    pathMatch: 'full',
  },
  {
    path: 'students',
    loadComponent: () =>
      import('./components/student-list/student-list.component').then(
        (m) => m.StudentListComponent,
      ),
    canActivate: [authGuard],
    data: {
      roles: ROUTE_PERMISSIONS.academicCatalog,
    },
  },
  {
    path: 'students/new',
    loadComponent: () =>
      import('./components/student-registration/student-registration.component').then(
        (m) => m.StudentRegistrationComponent,
      ),
    canActivate: [authGuard],
    data: { roles: ROUTE_PERMISSIONS.academicCatalog },
  },
  {
    path: 'professors',
    loadComponent: () =>
      import('./components/professor-list/professor-list.component').then(
        (m) => m.ProfessorListComponent,
      ),
    canActivate: [authGuard],
    data: {
      roles: ROUTE_PERMISSIONS.academicCatalog,
    },
  },
  {
    path: 'professors/new',
    loadComponent: () =>
      import('./components/professor-registration/professor-registration.component').then(
        (m) => m.ProfessorRegistrationComponent,
      ),
    canActivate: [authGuard],
    data: { roles: ROUTE_PERMISSIONS.academicCatalog },
  },
];
