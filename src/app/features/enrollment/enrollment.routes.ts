import { Routes } from '@angular/router';

import { authGuard } from '../../core/auth/guards/auth.guard';
import { ROUTE_PERMISSIONS } from '../../core/auth/rbac.policy';
import { RoleType } from '../../models';
import { FeaturePlaceholderComponent } from '../../shared/components';

const placeholderRoute = (
  path: string,
  titleKey: string,
  messageKey: string,
  roles: readonly RoleType[],
) => ({
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
    ROUTE_PERMISSIONS.advisorApproval,
  ),
  placeholderRoute(
    'form-pdf',
    'ENROLLMENT.FORM_PDF.TITLE',
    'ENROLLMENT.FORM_PDF.MESSAGE',
    ROUTE_PERMISSIONS.enrollmentFormPdf,
  ),
  placeholderRoute(
    'terms',
    'ENROLLMENT.TERMS.TITLE',
    'ENROLLMENT.TERMS.MESSAGE',
    ROUTE_PERMISSIONS.enrollmentTerms,
  ),
  placeholderRoute(
    'status',
    'ENROLLMENT.STATUS.TITLE',
    'ENROLLMENT.STATUS.MESSAGE',
    ROUTE_PERMISSIONS.enrollmentStatus,
  ),
];
