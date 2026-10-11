import { Routes } from '@angular/router';

export const EXAM_REQUESTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/exam-requirements-list/exam-requirements-list.component').then(
        (m) => m.ExamRequirementsListComponent,
      ),
  },
];
