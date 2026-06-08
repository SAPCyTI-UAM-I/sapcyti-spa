import { environment } from '../../../environments/environment';

export const AUTH_ENDPOINTS = {
  login: `${environment.apiBaseUrl}/auth/login`,
  refresh: `${environment.apiBaseUrl}/auth/refresh`,
  logout: `${environment.apiBaseUrl}/auth/logout`,
  forgotPassword: `${environment.apiBaseUrl}/auth/forgot-password`,
  resetPassword: `${environment.apiBaseUrl}/auth/reset-password`,
} as const;

const AUTH_SESSION_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'] as const;

export function isAuthSessionRequest(url: string): boolean {
  return AUTH_SESSION_PATHS.some((path) => url.includes(path));
}

export function shouldSkipBearer(url: string): boolean {
  return isAuthSessionRequest(url);
}

export function isAuthEndpoint(url: string): boolean {
  return url.includes('/auth/');
}
