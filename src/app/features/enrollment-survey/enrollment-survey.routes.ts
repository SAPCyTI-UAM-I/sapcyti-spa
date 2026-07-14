import { Routes } from '@angular/router';

import { authGuard } from '../../core/auth/guards/auth.guard';
import { ROUTE_PERMISSIONS } from '../../core/auth/rbac.policy';

const coordinator = { roles: ROUTE_PERMISSIONS.enrollmentSurvey };
const student = { roles: ROUTE_PERMISSIONS.enrollmentSurveyResponse };

export const ENROLLMENT_SURVEY_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/survey-list/survey-list.component').then((m) => m.SurveyListComponent),
    canActivate: [authGuard],
    data: coordinator,
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/survey-form/survey-form.component').then((m) => m.SurveyFormComponent),
    canActivate: [authGuard],
    data: { ...coordinator, breadcrumb: 'ENROLLMENT_SURVEY.BREADCRUMB.NEW' },
  },
  {
    path: 'respond',
    loadComponent: () =>
      import('./components/survey-response/survey-response.component').then(
        (m) => m.SurveyResponseComponent,
      ),
    canActivate: [authGuard],
    data: { ...student, breadcrumb: 'ENROLLMENT_SURVEY.BREADCRUMB.RESPOND' },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./components/survey-form/survey-form.component').then((m) => m.SurveyFormComponent),
    canActivate: [authGuard],
    data: { ...coordinator, breadcrumb: 'ENROLLMENT_SURVEY.BREADCRUMB.EDIT' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/survey-detail/survey-detail.component').then(
        (m) => m.SurveyDetailComponent,
      ),
    canActivate: [authGuard],
    data: { ...coordinator, breadcrumb: 'ENROLLMENT_SURVEY.BREADCRUMB.DETAIL' },
  },
];
