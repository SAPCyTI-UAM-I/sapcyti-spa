import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

import { AuthResponse } from '../../../models/auth-response.model';
import { RoleType } from '../../../models/role-type.model';

export interface AuthMockUser {
  email: string;
  password: string;
  role: RoleType;
  id: number;
  graduateProgramId: number;
}

export const AUTH_MOCK_USERS: readonly AuthMockUser[] = [
  {
    email: 'student@uam.mx',
    password: 'password',
    role: 'STUDENT',
    id: 1,
    graduateProgramId: 1,
  },
  {
    email: 'professor@uam.mx',
    password: 'password',
    role: 'PROFESSOR',
    id: 2,
    graduateProgramId: 1,
  },
  {
    email: 'assistant@uam.mx',
    password: 'password',
    role: 'ASSISTANT',
    id: 3,
    graduateProgramId: 1,
  },
  {
    email: 'coordinator@uam.mx',
    password: 'password',
    role: 'COORDINATOR',
    id: 4,
    graduateProgramId: 1,
  },
  {
    email: 'admin@uam.mx',
    password: 'password',
    role: 'SYSTEM_ADMIN',
    id: 5,
    graduateProgramId: 1,
  },
];

function createMockAccessToken(user: AuthMockUser): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: String(user.id),
      role: user.role,
      graduateProgramId: user.graduateProgramId,
    }),
  );

  return `${header}.${payload}.mock-signature`;
}

function findMockUser(email: string, password: string): AuthMockUser | undefined {
  const normalizedEmail = email.trim().toLowerCase();

  return AUTH_MOCK_USERS.find(
    (user) => user.email === normalizedEmail && user.password === password,
  );
}

export function mockLogin(email: string, password: string): Observable<AuthResponse> {
  const user = findMockUser(email, password);

  if (!user) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 401,
          statusText: 'Unauthorized',
          url: '/mock/auth/login',
        }),
    );
  }

  return of({
    accessToken: createMockAccessToken(user),
    expiresIn: 900,
    role: user.role,
  });
}

export function mockRequestPasswordReset(_email: string): Observable<void> {
  void _email;
  return of(void 0);
}

export const MOCK_VALID_RESET_TOKEN = 'mock-valid-reset-token';

export function mockResetPassword(token: string, _newPassword: string): Observable<void> {
  void _newPassword;
  if (token !== MOCK_VALID_RESET_TOKEN) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 400,
          statusText: 'Bad Request',
          url: '/mock/auth/reset-password',
          error: { code: 'INVALID_TOKEN' },
        }),
    );
  }

  return of(void 0);
}
