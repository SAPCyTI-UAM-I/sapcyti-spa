import { inject, Injectable, signal } from '@angular/core';

import {
  CoordinatorDashboardMetrics,
  ProfessorDashboardData,
  StudentDashboardData,
} from '../models/dashboard.model';
import { DASHBOARD_REPOSITORY } from '../repositories/dashboard.repository';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly repository = inject(DASHBOARD_REPOSITORY);

  readonly coordinatorMetrics = signal<CoordinatorDashboardMetrics | null>(null);
  readonly studentData = signal<StudentDashboardData | null>(null);
  readonly professorData = signal<ProfessorDashboardData | null>(null);

  readonly loading = signal(false);
  readonly error = signal(false);

  loadCoordinatorMetrics(): void {
    this.loading.set(true);
    this.error.set(false);

    this.repository.getCoordinatorMetrics().subscribe({
      next: (metrics) => {
        this.coordinatorMetrics.set(metrics);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  loadStudentData(): void {
    this.loading.set(true);
    this.error.set(false);

    this.repository.getStudentDashboard().subscribe({
      next: (data) => {
        this.studentData.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  loadProfessorData(): void {
    this.loading.set(true);
    this.error.set(false);

    this.repository.getProfessorDashboard().subscribe({
      next: (data) => {
        this.professorData.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
