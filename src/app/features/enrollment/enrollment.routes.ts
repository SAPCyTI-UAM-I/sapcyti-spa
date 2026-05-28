import { Routes } from '@angular/router';

import { FeaturePlaceholderComponent } from '../../shared/components/feature-placeholder/feature-placeholder.component';

export const ENROLLMENT_ROUTES: Routes = [
  {
    path: '',
    component: FeaturePlaceholderComponent,
    data: {
      titleKey: 'ENROLLMENT.PLACEHOLDER.TITLE',
      messageKey: 'ENROLLMENT.PLACEHOLDER.MESSAGE',
    },
  },
];
