import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, finalize, map, Observable, of, switchMap, tap, throwError } from 'rxjs';

import { AuthResponse } from '../../models/auth-response.model';
import { CurrentUser } from '../../models/current-user.model';
import { JwtClaims } from '../../models/jwt-claims.model';
import { isRoleType, RoleType } from '../../models/role-type.model';
import { TenantService } from '../http/tenant.service';
import { injectMockEnabled } from '../mocks/mock.config';
import { AUTH_ENDPOINTS } from './auth.endpoints';
import { mockLogin } from './mock/auth.mock';
import { decodeJwtPayload } from './utils/jwt.util';
import { matchesAnyRole } from './utils/role-authorization.util';

const REMEMBER_SESSION_KEY = 'sapcyti.auth.rememberSession';
const REMEMBERED_EMAIL_KEY = 'sapcyti.auth.rememberedEmail';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly http = inject(HttpClient);
  private readonly tenantService = inject(TenantService);
  private readonly useAuthMock = injectMockEnabled('auth');

  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private readonly currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  isAuthenticated(): boolean {
    if (this.accessToken === null || this.currentUserSubject.value === null) {
      return false;
    }

    if (this.tokenExpiresAt !== null && Date.now() >= this.tokenExpiresAt) {
      this.clearRuntimeSession();
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
    const login$ = this.useAuthMock
      ? mockLogin(email, password)
      : this.http.post<AuthResponse>(
          AUTH_ENDPOINTS.login,
          {
            email,
            password,
            rememberMe,
            deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          },
          { withCredentials: true },
        );

    return login$.pipe(
      tap((response) => {
        this.applyAuthSuccess(email, response);
        this.updateRememberedSession(email, rememberMe);
      }),
      map(() => void 0),
    );
  }

  restoreRememberedSession(): Observable<void> {
    const rememberedEmail = this.getRememberedEmail();
    if (this.useAuthMock || !this.shouldRestoreRememberedSession() || !rememberedEmail) {
      return of(void 0);
    }

    return this.http
      .post<AuthResponse>(AUTH_ENDPOINTS.refresh, {}, { withCredentials: true })
      .pipe(
        tap((response) => this.applyAuthSuccess(rememberedEmail, response)),
        map(() => void 0),
        catchError(() => {
          this.clearSessionState();
          return of(void 0);
        }),
      );
  }

  silentRefresh(): Observable<void> {
    if (this.useAuthMock) {
      return of(void 0);
    }

    const email = this.currentUserSubject.value?.email ?? this.getRememberedEmail();
    if (!email) {
      return this.logout();
    }

    return this.http
      .post<AuthResponse>(AUTH_ENDPOINTS.refresh, {}, { withCredentials: true })
      .pipe(
        tap((response) => this.applyAuthSuccess(email, response)),
        map(() => void 0),
        catchError((error) =>
          this.logout().pipe(switchMap(() => throwError(() => error))),
        ),
      );
  }

  logout(): Observable<void> {
    const logout$ = this.useAuthMock
      ? of(void 0)
      : this.http
          .post<void>(AUTH_ENDPOINTS.logout, {}, { withCredentials: true })
          .pipe(
            map(() => void 0),
            catchError(() => of(void 0)),
          );

    return logout$.pipe(finalize(() => this.clearSessionState()));
  }

  private clearSessionState(): void {
    this.clearRememberedSession();
    this.clearRuntimeSession();
  }

  private clearRuntimeSession(): void {
    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.currentUserSubject.next(null);
    this.tenantService.clear();
  }

  private updateRememberedSession(email: string, rememberMe: boolean): void {
    if (!rememberMe) {
      this.clearRememberedSession();
      return;
    }

    this.writeStorage(REMEMBER_SESSION_KEY, 'true');
    this.writeStorage(REMEMBERED_EMAIL_KEY, email.trim().toLowerCase());
  }

  private shouldRestoreRememberedSession(): boolean {
    return this.readStorage(REMEMBER_SESSION_KEY) === 'true';
  }

  private getRememberedEmail(): string | null {
    return this.readStorage(REMEMBERED_EMAIL_KEY);
  }

  private clearRememberedSession(): void {
    this.removeStorage(REMEMBER_SESSION_KEY);
    this.removeStorage(REMEMBERED_EMAIL_KEY);
  }

  private readStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Persistence is best-effort; authentication still works with in-memory state.
    }
  }

  private removeStorage(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage failures in restricted browser contexts.
    }
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
