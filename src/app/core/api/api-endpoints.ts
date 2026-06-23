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
  professors: `${environment.apiBaseUrl}/professors`,
  userPassword: (userId: number): string => `${environment.apiBaseUrl}/users/${userId}/password`,
} as const;
