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
  userPassword: (userId: number): string => `${environment.apiBaseUrl}/users/${userId}/password`,
} as const;
