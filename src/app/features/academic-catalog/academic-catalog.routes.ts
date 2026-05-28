import { Routes } from '@angular/router';

import { FeaturePlaceholderComponent } from '../../shared/components/feature-placeholder/feature-placeholder.component';

export const ACADEMIC_CATALOG_ROUTES: Routes = [
  {
    path: '',
    component: FeaturePlaceholderComponent,
    data: {
      titleKey: 'ACADEMIC_CATALOG.PLACEHOLDER.TITLE',
      messageKey: 'ACADEMIC_CATALOG.PLACEHOLDER.MESSAGE',
    },
  },
];
