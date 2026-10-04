import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CoordinatorDashboardMetrics,
  ProfessorDashboardData,
  StudentDashboardData,
} from '../models/dashboard.model';

export interface DashboardRepository {
  getCoordinatorMetrics(): Observable<CoordinatorDashboardMetrics>;
  getStudentDashboard(): Observable<StudentDashboardData>;
  getProfessorDashboard(): Observable<ProfessorDashboardData>;
}

export const DASHBOARD_REPOSITORY = new InjectionToken<DashboardRepository>('DashboardRepository');
