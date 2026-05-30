import { Routes } from '@angular/router';

import { authGuard } from '../../core/auth/auth.guard';
import { ROUTE_PERMISSIONS } from '../../core/auth/rbac.policy';
import { FeaturePlaceholderComponent } from '../../shared/components/feature-placeholder/feature-placeholder.component';

export const PRESENTATIONS_ROUTES: Routes = [
  {
    path: '',
    component: FeaturePlaceholderComponent,
    canActivate: [authGuard],
    data: {
      titleKey: 'PRESENTATIONS.PLACEHOLDER.TITLE',
      messageKey: 'PRESENTATIONS.PLACEHOLDER.MESSAGE',
      roles: ROUTE_PERMISSIONS.presentations,
    },
  },
];
