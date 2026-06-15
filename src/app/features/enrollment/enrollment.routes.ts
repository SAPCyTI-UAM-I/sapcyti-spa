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
  breadcrumb: string,
) => ({
  path,
  component: FeaturePlaceholderComponent,
  canActivate: [authGuard],
  data: { titleKey, messageKey, roles, breadcrumb },
});

export const ENROLLMENT_ROUTES: Routes = [
  {
    // Enrollment has no landing of its own — only its children are reachable.
    path: '',
    redirectTo: '/not-found',
    pathMatch: 'full',
  },
  placeholderRoute(
    'advisor-approval',
    'ENROLLMENT.ADVISOR_APPROVAL.TITLE',
    'ENROLLMENT.ADVISOR_APPROVAL.MESSAGE',
    ROUTE_PERMISSIONS.advisorApproval,
    'BREADCRUMB.ADVISOR_APPROVAL',
  ),
  placeholderRoute(
    'form-pdf',
    'ENROLLMENT.FORM_PDF.TITLE',
    'ENROLLMENT.FORM_PDF.MESSAGE',
    ROUTE_PERMISSIONS.enrollmentFormPdf,
    'BREADCRUMB.FORM_PDF',
  ),
  placeholderRoute(
    'terms',
    'ENROLLMENT.TERMS.TITLE',
    'ENROLLMENT.TERMS.MESSAGE',
    ROUTE_PERMISSIONS.enrollmentTerms,
    'BREADCRUMB.TERMS',
  ),
  placeholderRoute(
    'status',
    'ENROLLMENT.STATUS.TITLE',
    'ENROLLMENT.STATUS.MESSAGE',
    ROUTE_PERMISSIONS.enrollmentStatus,
    'BREADCRUMB.STATUS',
  ),
];
