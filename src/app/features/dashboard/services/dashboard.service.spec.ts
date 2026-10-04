import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';

import {
  CoordinatorDashboardMetrics,
  ProfessorDashboardData,
  StudentDashboardData,
} from '../models/dashboard.model';
import { DASHBOARD_REPOSITORY, DashboardRepository } from '../repositories/dashboard.repository';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const mockMetrics: CoordinatorDashboardMetrics = {
    totalStudents: 10,
    totalProfessors: 5,
    totalUeas: 8,
    activeSurvey: null,
    latestAnnualPlanYear: 2026,
  };

  const mockStudentData: StudentDashboardData = {
    studentName: 'Juan Perez',
    enrollmentId: '2213000001',
    programType: 'MAESTRIA',
    activeSurvey: null,
  };

  const mockProfessorData: ProfessorDashboardData = {
    professorName: 'Dr. Lopez',
    email: 'lopez@correo.cua.uam.mx',
  };

  const fakeRepo: DashboardRepository = {
    getCoordinatorMetrics: () => of(mockMetrics),
    getStudentDashboard: () => of(mockStudentData),
    getProfessorDashboard: () => of(mockProfessorData),
  };

  it('loads coordinator metrics successfully', () => {
    TestBed.configureTestingModule({
      providers: [DashboardService, { provide: DASHBOARD_REPOSITORY, useValue: fakeRepo }],
    });

    const service = TestBed.inject(DashboardService);
    service.loadCoordinatorMetrics();

    expect(service.loading()).toBe(false);
    expect(service.error()).toBe(false);
    expect(service.coordinatorMetrics()).toEqual(mockMetrics);
  });

  it('handles coordinator metrics error', () => {
    const errorRepo: DashboardRepository = {
      ...fakeRepo,
      getCoordinatorMetrics: () => throwError(() => new Error('Network error')),
    };

    TestBed.configureTestingModule({
      providers: [DashboardService, { provide: DASHBOARD_REPOSITORY, useValue: errorRepo }],
    });

    const service = TestBed.inject(DashboardService);
    service.loadCoordinatorMetrics();

    expect(service.loading()).toBe(false);
    expect(service.error()).toBe(true);
    expect(service.coordinatorMetrics()).toBeNull();
  });

  it('loads student data successfully', () => {
    TestBed.configureTestingModule({
      providers: [DashboardService, { provide: DASHBOARD_REPOSITORY, useValue: fakeRepo }],
    });

    const service = TestBed.inject(DashboardService);
    service.loadStudentData();

    expect(service.loading()).toBe(false);
    expect(service.studentData()).toEqual(mockStudentData);
  });

  it('loads professor data successfully', () => {
    TestBed.configureTestingModule({
      providers: [DashboardService, { provide: DASHBOARD_REPOSITORY, useValue: fakeRepo }],
    });

    const service = TestBed.inject(DashboardService);
    service.loadProfessorData();

    expect(service.loading()).toBe(false);
    expect(service.professorData()).toEqual(mockProfessorData);
  });
});
