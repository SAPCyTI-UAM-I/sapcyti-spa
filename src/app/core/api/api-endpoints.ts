import { environment } from '../../../environments/environment';

export const API_ENDPOINTS = {
  auth: {
    login: `${environment.apiBaseUrl}/auth/login`,
    refresh: `${environment.apiBaseUrl}/auth/refresh`,
    logout: `${environment.apiBaseUrl}/auth/logout`,
    forgotPassword: `${environment.apiBaseUrl}/auth/forgot-password`,
    resetPassword: `${environment.apiBaseUrl}/auth/reset-password`,
  },
  students: `${environment.apiBaseUrl}/students`,
  student: (studentId: number): string => `${environment.apiBaseUrl}/students/${studentId}`,
  studentPrograms: (studentId: number): string =>
    `${environment.apiBaseUrl}/students/${studentId}/programs`,
  studentProgram: (studentId: number, programId: number): string =>
    `${environment.apiBaseUrl}/students/${studentId}/programs/${programId}`,
  professors: `${environment.apiBaseUrl}/professors`,
  professor: (professorId: number): string => `${environment.apiBaseUrl}/professors/${professorId}`,
  professorDeactivate: (professorId: number): string =>
    `${environment.apiBaseUrl}/professors/${professorId}/deactivate`,
  professorRestore: (professorId: number): string =>
    `${environment.apiBaseUrl}/professors/${professorId}/restore`,
  researchCatalog: `${environment.apiBaseUrl}/research-catalog`,
  ueas: `${environment.apiBaseUrl}/ueas`,
  ueasBulk: `${environment.apiBaseUrl}/ueas/bulk`,
  uea: (ueaId: number): string => `${environment.apiBaseUrl}/ueas/${ueaId}`,
  ueaDeactivate: (ueaId: number): string => `${environment.apiBaseUrl}/ueas/${ueaId}/deactivate`,
  ueaRestore: (ueaId: number): string => `${environment.apiBaseUrl}/ueas/${ueaId}/restore`,
  annualPlans: `${environment.apiBaseUrl}/annual-plans`,
  annualPlansCheck: `${environment.apiBaseUrl}/annual-plans/check`,
  annualPlan: (year: number): string => `${environment.apiBaseUrl}/annual-plans/${year}`,
  annualPlanEntries: (year: number): string =>
    `${environment.apiBaseUrl}/annual-plans/${year}/entries`,
  annualPlanStatus: (year: number): string =>
    `${environment.apiBaseUrl}/annual-plans/${year}/status`,
  annualPlanExport: (year: number): string =>
    `${environment.apiBaseUrl}/annual-plans/${year}/export`,
  trimestralPlans: `${environment.apiBaseUrl}/trimestral-plans`,
  trimestralPlan: (id: number): string => `${environment.apiBaseUrl}/trimestral-plans/${id}`,
  trimestralPlanGroups: (id: number): string =>
    `${environment.apiBaseUrl}/trimestral-plans/${id}/groups`,
  trimestralPlanRegenerate: (id: number): string =>
    `${environment.apiBaseUrl}/trimestral-plans/${id}/regenerate`,
  trimestralPlanStatus: (id: number): string =>
    `${environment.apiBaseUrl}/trimestral-plans/${id}/status`,
  trimestralPlanExport: (id: number): string =>
    `${environment.apiBaseUrl}/trimestral-plans/${id}/export`,
  studentEnrollmentHistory: (studentId: number): string =>
    `${environment.apiBaseUrl}/students/${studentId}/enrollment-history`,
  userPassword: (userId: number): string => `${environment.apiBaseUrl}/users/${userId}/password`,
  enrollmentSurveys: `${environment.apiBaseUrl}/enrollment-surveys`,
  enrollmentSurveyActive: `${environment.apiBaseUrl}/enrollment-surveys/active`,
  enrollmentSurvey: (id: number): string => `${environment.apiBaseUrl}/enrollment-surveys/${id}`,
  enrollmentSurveyClose: (id: number): string =>
    `${environment.apiBaseUrl}/enrollment-surveys/${id}/close`,
  enrollmentSurveyResponses: (id: number): string =>
    `${environment.apiBaseUrl}/enrollment-surveys/${id}/responses`,
  enrollmentSurveyMyResponse: (id: number): string =>
    `${environment.apiBaseUrl}/enrollment-surveys/${id}/responses/me`,
  enrollmentSurveyResultsSummary: (id: number): string =>
    `${environment.apiBaseUrl}/enrollment-surveys/${id}/results/summary`,
  enrollmentSurveyResultsUeas: (id: number): string =>
    `${environment.apiBaseUrl}/enrollment-surveys/${id}/results/ueas`,
  enrollmentSurveyResultsUeaStudents: (id: number, ueaId: number): string =>
    `${environment.apiBaseUrl}/enrollment-surveys/${id}/results/ueas/${ueaId}/students`,
  enrollmentSurveyResultsBlankStudents: (id: number): string =>
    `${environment.apiBaseUrl}/enrollment-surveys/${id}/results/blank-students`,
} as const;
