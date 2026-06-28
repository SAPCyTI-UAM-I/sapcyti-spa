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
  researchCatalog: `${environment.apiBaseUrl}/research-catalog`,
  ueas: `${environment.apiBaseUrl}/ueas`,
  ueasBulk: `${environment.apiBaseUrl}/ueas/bulk`,
  userPassword: (userId: number): string => `${environment.apiBaseUrl}/users/${userId}/password`,
} as const;
