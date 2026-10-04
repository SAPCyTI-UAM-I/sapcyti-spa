import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { AuthStateService } from '../../../core/auth/auth.service';
import {
  CoordinatorDashboardMetrics,
  ProfessorDashboardData,
  StudentDashboardData,
} from '../models/dashboard.model';
import { DashboardRepository } from './dashboard.repository';

@Injectable()
export class DashboardMockRepository implements DashboardRepository {
  private readonly auth = inject(AuthStateService);

  getCoordinatorMetrics(): Observable<CoordinatorDashboardMetrics> {
    return of({
      totalStudents: 38,
      totalProfessors: 14,
      totalUeas: 26,
      activeSurvey: {
        id: 1,
        term: '26-I',
        opensAt: '2026-01-10T08:00:00Z',
        closesAt: '2026-01-25T23:59:59Z',
        status: 'ACTIVE',
        totalResponses: 29,
      },
      latestAnnualPlanYear: 2026,
    });
  }

  getStudentDashboard(): Observable<StudentDashboardData> {
    const user = this.auth.getCurrentUser();
    return of({
      studentName: user?.email ? 'Carlos Mendoza Silva' : 'Estudiante Activo',
      enrollmentId: '223300456',
      programType: 'Maestría en Ciencias y Tecnologías de la Información',
      activeSurvey: {
        id: 1,
        term: '26-I',
        opensAt: '2026-01-10T08:00:00Z',
        closesAt: '2026-01-25T23:59:59Z',
        hasResponded: false,
      },
    });
  }

  getProfessorDashboard(): Observable<ProfessorDashboardData> {
    const user = this.auth.getCurrentUser();
    return of({
      professorName: user?.email ? 'Dr. Roberto Sánchez Gómez' : 'Profesor Investigador',
      email: user?.email ?? 'prof.pcd@posgrado.uam.mx',
    });
  }
}
