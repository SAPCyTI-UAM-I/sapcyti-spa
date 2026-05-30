import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse } from '../../models/auth-response.model';
import { CurrentUser } from '../../models/current-user.model';
import { JwtClaims } from '../../models/jwt-claims.model';
import { isRoleType, RoleType } from '../../models/role-type.model';
import { TenantService } from '../http/tenant.service';
import { injectMockEnabled } from '../mocks/mock.config';
import { mockLogin, mockRequestPasswordReset } from './auth.mock';
import { decodeJwtPayload } from './jwt.util';
import { matchesAnyRole } from './role-authorization.util';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly http = inject(HttpClient);
  private readonly tenantService = inject(TenantService);
  private readonly useMock = injectMockEnabled('auth');

  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private readonly currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  isAuthenticated(): boolean {
    if (this.accessToken === null || this.currentUserSubject.value === null) {
      return false;
    }

    if (this.tokenExpiresAt !== null && Date.now() >= this.tokenExpiresAt) {
      this.logout();
      return false;
    }

    return true;
  }

  hasRole(role: RoleType | readonly RoleType[]): boolean {
    const user = this.currentUserSubject.value;
    if (!user) {
      return false;
    }

    const roles = Array.isArray(role) ? role : [role];
    return matchesAnyRole(user.role, roles);
  }

  getCurrentUser(): CurrentUser | null {
    return this.currentUserSubject.getValue();
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  login(email: string, password: string, rememberMe = false): Observable<void> {
    const login$ = this.useMock
      ? mockLogin(email, password)
      : this.http.post<AuthResponse>(
          `${environment.apiBaseUrl}/auth/login`,
          {
            email,
            password,
            rememberMe,
            deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          },
          { withCredentials: true },
        );

    return login$.pipe(
      tap((response) => this.applyAuthSuccess(email, response)),
      map(() => void 0),
    );
  }

  requestPasswordReset(email: string): Observable<void> {
    if (this.useMock) {
      return mockRequestPasswordReset(email);
    }

    return this.http
      .post<void>(
        `${environment.apiBaseUrl}/auth/forgot-password`,
        { email },
        { withCredentials: true },
      )
      .pipe(map(() => void 0));
  }

  logout(): void {
    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.currentUserSubject.next(null);
    this.tenantService.clear();
  }

  private applyAuthSuccess(email: string, response: AuthResponse): void {
    this.accessToken = response.accessToken;

    const claims = decodeJwtPayload<JwtClaims>(response.accessToken);
    this.tokenExpiresAt =
      typeof claims.exp === 'number' ? claims.exp * 1000 : Date.now() + response.expiresIn * 1000;

    const role = isRoleType(response.role) ? response.role : claims.role;

    if (!isRoleType(role)) {
      throw new Error('Invalid role in auth response');
    }

    const graduateProgramId = claims.graduateProgramId ?? null;
    const user: CurrentUser = {
      id: Number(claims.sub),
      email,
      role,
      graduateProgramId,
    };

    this.currentUserSubject.next(user);

    if (graduateProgramId !== null) {
      this.tenantService.set(graduateProgramId);
    } else {
      this.tenantService.clear();
    }
  }
}
