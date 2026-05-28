import { Routes } from '@angular/router';

import { FeaturePlaceholderComponent } from '../../shared/components/feature-placeholder/feature-placeholder.component';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: FeaturePlaceholderComponent,
    data: {
      titleKey: 'AUTH.PLACEHOLDER.TITLE',
      messageKey: 'AUTH.PLACEHOLDER.MESSAGE',
    },
  },
];
