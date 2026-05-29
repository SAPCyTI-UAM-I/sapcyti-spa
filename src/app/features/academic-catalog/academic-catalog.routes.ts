import { Routes } from '@angular/router';

import { authGuard } from '../../core/auth/auth.guard';
import { FeaturePlaceholderComponent } from '../../shared/components/feature-placeholder/feature-placeholder.component';

export const ACADEMIC_CATALOG_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'students',
    pathMatch: 'full',
  },
  {
    path: 'students',
    component: FeaturePlaceholderComponent,
    canActivate: [authGuard],
    data: {
      titleKey: 'ACADEMIC_CATALOG.STUDENTS.TITLE',
      messageKey: 'ACADEMIC_CATALOG.STUDENTS.MESSAGE',
      roles: ['COORDINATOR', 'ASSISTANT', 'SYSTEM_ADMIN'],
    },
  },
  {
    path: 'professors',
    component: FeaturePlaceholderComponent,
    canActivate: [authGuard],
    data: {
      titleKey: 'ACADEMIC_CATALOG.PROFESSORS.TITLE',
      messageKey: 'ACADEMIC_CATALOG.PROFESSORS.MESSAGE',
      roles: ['COORDINATOR', 'ASSISTANT', 'SYSTEM_ADMIN'],
    },
  },
];
