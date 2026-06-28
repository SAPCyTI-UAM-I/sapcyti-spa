import { Routes } from '@angular/router';

import { authGuard } from '../../core/auth/guards/auth.guard';
import { ROUTE_PERMISSIONS } from '../../core/auth/rbac.policy';

const catalogData = { roles: ROUTE_PERMISSIONS.academicCatalog };

export const ACADEMIC_CATALOG_ROUTES: Routes = [
  {
    // Academic catalog has no landing of its own — only its children are reachable.
    path: '',
    redirectTo: '/not-found',
    pathMatch: 'full',
  },
  {
    // Componentless grouping route: contributes the "Students" breadcrumb without
    // an extra outlet, so the list/new pages render in the shell outlet.
    path: 'students',
    data: { breadcrumb: 'SHELL.MENU.STUDENTS' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/student-list/student-list.component').then(
            (m) => m.StudentListComponent,
          ),
        canActivate: [authGuard],
        data: catalogData,
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./components/student-registration/student-registration.component').then(
            (m) => m.StudentRegistrationComponent,
          ),
        canActivate: [authGuard],
        data: { ...catalogData, breadcrumb: 'BREADCRUMB.NEW' },
      },
      {
        path: ':studentId',
        loadComponent: () =>
          import('./components/student-detail/student-detail.component').then(
            (m) => m.StudentDetailComponent,
          ),
        canActivate: [authGuard],
        data: { ...catalogData, breadcrumb: 'ACADEMIC_CATALOG.STUDENTS.BREADCRUMB.DETAIL' },
      },
      {
        path: ':studentId/edit',
        loadComponent: () =>
          import('./components/student-edit/student-edit.component').then(
            (m) => m.StudentEditComponent,
          ),
        canActivate: [authGuard],
        data: { ...catalogData, breadcrumb: 'ACADEMIC_CATALOG.STUDENTS.BREADCRUMB.EDIT' },
      },
    ],
  },
  {
    path: 'professors',
    data: { breadcrumb: 'SHELL.MENU.PROFESSORS' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/professor-list/professor-list.component').then(
            (m) => m.ProfessorListComponent,
          ),
        canActivate: [authGuard],
        data: catalogData,
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./components/professor-registration/professor-registration.component').then(
            (m) => m.ProfessorRegistrationComponent,
          ),
        canActivate: [authGuard],
        data: { ...catalogData, breadcrumb: 'BREADCRUMB.NEW' },
      },
    ],
  },
];
