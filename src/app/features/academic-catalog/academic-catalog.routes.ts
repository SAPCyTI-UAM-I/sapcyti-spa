import { Routes } from '@angular/router';

import { authGuard } from '../../core/auth/guards/auth.guard';
import { ROUTE_PERMISSIONS } from '../../core/auth/rbac.policy';
import { FeaturePlaceholderComponent } from '../../shared/components/feature-placeholder/feature-placeholder.component';

export const ACADEMIC_CATALOG_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'students',
    pathMatch: 'full',
  },
  {
    path: 'students',
    loadComponent: () =>
      import('./components/student-registration/student-registration.component').then(
        (m) => m.StudentRegistrationComponent,
      ),
    canActivate: [authGuard],
    data: {
      roles: ROUTE_PERMISSIONS.academicCatalog,
    },
  },
  {
    path: 'professors',
    component: FeaturePlaceholderComponent,
    canActivate: [authGuard],
    data: {
      titleKey: 'ACADEMIC_CATALOG.PROFESSORS.TITLE',
      messageKey: 'ACADEMIC_CATALOG.PROFESSORS.MESSAGE',
      roles: ROUTE_PERMISSIONS.academicCatalog,
    },
  },
];
