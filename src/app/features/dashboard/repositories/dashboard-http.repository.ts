import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { AuthStateService } from '../../../core/auth/auth.service';
import { PageResponse } from '../../../models';
import {
  CoordinatorDashboardMetrics,
  ProfessorDashboardData,
  StudentDashboardData,
} from '../models/dashboard.model';
import { DashboardRepository } from './dashboard.repository';

interface SurveyApiItem {
  id: number;
  term: string;
  opensAt: string;
  closesAt: string;
  status: string;
  totalResponses?: number;
}

interface AnnualPlanApiItem {
  year: number;
  status: string;
}

interface ActiveSurveyApiResponse {
  id: number;
  term: string;
  startsAt?: string;
  endsAt?: string;
  opensAt?: string;
  closesAt?: string;
  status: string;
  fullName?: string;
  enrollmentId?: string;
  programType?: string;
  hasResponded?: boolean;
  myResponse?: {
    selections?: unknown[];
  } | null;
}

@Injectable()
export class DashboardHttpRepository implements DashboardRepository {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthStateService);

  getCoordinatorMetrics(): Observable<CoordinatorDashboardMetrics> {
    const singleItemParams = new HttpParams().set('page', 0).set('size', 1);

    return forkJoin({
      students: this.http
        .get<PageResponse<unknown>>(API_ENDPOINTS.students, {
          params: singleItemParams,
          withCredentials: true,
        })
        .pipe(catchError(() => of({ totalElements: 0 } as PageResponse<unknown>))),
      professors: this.http
        .get<PageResponse<unknown>>(API_ENDPOINTS.professors, {
          params: singleItemParams,
          withCredentials: true,
        })
        .pipe(catchError(() => of({ totalElements: 0 } as PageResponse<unknown>))),
      ueas: this.http
        .get<PageResponse<unknown>>(API_ENDPOINTS.ueas, {
          params: singleItemParams,
          withCredentials: true,
        })
        .pipe(catchError(() => of({ totalElements: 0 } as PageResponse<unknown>))),
      surveys: this.http
        .get<SurveyApiItem[]>(API_ENDPOINTS.enrollmentSurveys, { withCredentials: true })
        .pipe(catchError(() => of([] as SurveyApiItem[]))),
      annualPlans: this.http
        .get<AnnualPlanApiItem[]>(API_ENDPOINTS.annualPlans, { withCredentials: true })
        .pipe(catchError(() => of([] as AnnualPlanApiItem[]))),
    }).pipe(
      map(({ students, professors, ueas, surveys, annualPlans }) => {
        const activeSurvey =
          surveys.find((s) => s.status === 'ACTIVE' || s.status === 'ACTIVO') ?? surveys[0] ?? null;

        const latestPlan = annualPlans.length > 0 ? annualPlans[annualPlans.length - 1] : null;

        return {
          totalStudents: students.totalElements ?? 0,
          totalProfessors: professors.totalElements ?? 0,
          totalUeas: ueas.totalElements ?? 0,
          activeSurvey: activeSurvey
            ? {
                id: activeSurvey.id,
                term: activeSurvey.term,
                opensAt: activeSurvey.opensAt,
                closesAt: activeSurvey.closesAt,
                status: activeSurvey.status,
                totalResponses: activeSurvey.totalResponses,
              }
            : null,
          latestAnnualPlanYear: latestPlan?.year ?? null,
        };
      }),
    );
  }

  getStudentDashboard(): Observable<StudentDashboardData> {
    const user = this.auth.getCurrentUser();

    return this.http
      .get<ActiveSurveyApiResponse>(API_ENDPOINTS.enrollmentSurveyActive, {
        withCredentials: true,
      })
      .pipe(
        map((survey) => ({
          studentName: survey.fullName ?? user?.email ?? 'Estudiante',
          enrollmentId: survey.enrollmentId ?? '—',
          programType: survey.programType ?? 'Posgrado',
          activeSurvey: {
            id: survey.id,
            term: survey.term,
            opensAt: survey.startsAt ?? survey.opensAt ?? '',
            closesAt: survey.endsAt ?? survey.closesAt ?? '',
            hasResponded: survey.hasResponded ?? Boolean(survey.myResponse),
            selectedUeasCount: survey.myResponse?.selections?.length ?? 0,
          },
        })),
        catchError(() =>
          of({
            studentName: user?.email ? (user.email.split('@')[0] ?? 'Estudiante') : 'Estudiante',
            enrollmentId: user?.id ? String(user.id) : '—',
            programType: 'Posgrado',
            activeSurvey: null,
          }),
        ),
      );
  }

  getProfessorDashboard(): Observable<ProfessorDashboardData> {
    const user = this.auth.getCurrentUser();
    return of({
      professorName: user?.email ? (user.email.split('@')[0] ?? 'Profesor') : 'Profesor',
      email: user?.email ?? '',
    });
  }
}
