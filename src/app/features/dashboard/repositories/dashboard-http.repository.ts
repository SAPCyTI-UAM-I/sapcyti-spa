import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { AuthStateService } from '../../../core/auth/auth.service';
import { PageResponse, StudentDetailResponse } from '../../../models';
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

    const student$ = this.http
      .get<StudentDetailResponse>(API_ENDPOINTS.studentsMe, {
        withCredentials: true,
      })
      .pipe(catchError(() => of(null)));

    const survey$ = this.http
      .get<ActiveSurveyApiResponse>(API_ENDPOINTS.enrollmentSurveyActive, {
        withCredentials: true,
      })
      .pipe(catchError(() => of(null)));

    return forkJoin({ student: student$, survey: survey$ }).pipe(
      map(({ student, survey }) => {
        let studentName = 'Estudiante';
        if (student) {
          studentName =
            `${student.firstName} ${student.firstLastName} ${student.secondLastName ?? ''}`.trim();
        } else if (survey?.fullName) {
          studentName = survey.fullName;
        } else if (user?.email) {
          studentName = user.email.split('@')[0] ?? 'Estudiante';
        }

        const enrollmentId = student?.enrollmentId ?? survey?.enrollmentId ?? '—';
        const programType = student?.programType ?? survey?.programType ?? 'Posgrado';

        return {
          studentName,
          enrollmentId,
          programType,
          activeSurvey: survey
            ? {
                id: survey.id,
                term: survey.term,
                opensAt: survey.startsAt ?? survey.opensAt ?? '',
                closesAt: survey.endsAt ?? survey.closesAt ?? '',
                hasResponded: survey.hasResponded ?? Boolean(survey.myResponse),
                selectedUeasCount: survey.myResponse?.selections?.length ?? 0,
              }
            : null,
        };
      }),
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
