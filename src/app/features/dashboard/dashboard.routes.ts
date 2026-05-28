import { Routes } from '@angular/router';

import { FeaturePlaceholderComponent } from '../../shared/components/feature-placeholder/feature-placeholder.component';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: FeaturePlaceholderComponent,
    data: {
      titleKey: 'DASHBOARD.PLACEHOLDER.TITLE',
      messageKey: 'DASHBOARD.PLACEHOLDER.MESSAGE',
    },
  },
];
