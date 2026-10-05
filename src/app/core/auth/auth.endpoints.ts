const AUTH_SESSION_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'] as const;

export function isAuthSessionRequest(url: string): boolean {
  return AUTH_SESSION_PATHS.some((path) => url.includes(path));
}

export function isAuthEndpoint(url: string): boolean {
  return url.includes('/auth/');
}
