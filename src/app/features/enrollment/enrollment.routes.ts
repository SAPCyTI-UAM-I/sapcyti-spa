import { Routes } from '@angular/router';

import { authGuard } from '../../core/auth/auth.guard';
import { FeaturePlaceholderComponent } from '../../shared/components/feature-placeholder/feature-placeholder.component';

const placeholderRoute = (path: string, titleKey: string, messageKey: string, roles: string[]) => ({
  path,
  component: FeaturePlaceholderComponent,
  canActivate: [authGuard],
  data: { titleKey, messageKey, roles },
});

export const ENROLLMENT_ROUTES: Routes = [
  {
    path: '',
    component: FeaturePlaceholderComponent,
    data: {
      titleKey: 'ENROLLMENT.PLACEHOLDER.TITLE',
      messageKey: 'ENROLLMENT.PLACEHOLDER.MESSAGE',
    },
  },
  placeholderRoute(
    'advisor-approval',
    'ENROLLMENT.ADVISOR_APPROVAL.TITLE',
    'ENROLLMENT.ADVISOR_APPROVAL.MESSAGE',
    ['PROFESSOR'],
  ),
  placeholderRoute('form-pdf', 'ENROLLMENT.FORM_PDF.TITLE', 'ENROLLMENT.FORM_PDF.MESSAGE', [
    'ASSISTANT',
    'COORDINATOR',
    'SYSTEM_ADMIN',
  ]),
  placeholderRoute('terms', 'ENROLLMENT.TERMS.TITLE', 'ENROLLMENT.TERMS.MESSAGE', [
    'COORDINATOR',
    'SYSTEM_ADMIN',
  ]),
  placeholderRoute('status', 'ENROLLMENT.STATUS.TITLE', 'ENROLLMENT.STATUS.MESSAGE', [
    'COORDINATOR',
    'SYSTEM_ADMIN',
  ]),
];
