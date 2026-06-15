import { API_ENDPOINTS } from '../api/api-endpoints';

/** @deprecated Import `API_ENDPOINTS.auth` from `core/api/api-endpoints` instead. */
export const AUTH_ENDPOINTS = API_ENDPOINTS.auth;

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
