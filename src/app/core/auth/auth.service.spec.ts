import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { TenantService } from '../http/tenant.service';
import { AppMockConfig, provideAppMockConfig } from '../mocks/mock.config';
import { AuthStateService } from './auth.service';

const LOGIN_URL = 'http://localhost:8080/api/auth/login';
const FORGOT_PASSWORD_URL = 'http://localhost:8080/api/auth/forgot-password';

function createTestJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.test-signature`;
}

describe('AuthStateService', () => {
  let service: AuthStateService;
  let httpMock: HttpTestingController;
  let tenantService: TenantService;

  function setup(mocks: Partial<AppMockConfig> = { auth: false }): void {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAppMockConfig(mocks)],
    });

    service = TestBed.inject(AuthStateService);
    httpMock = TestBed.inject(HttpTestingController);
    tenantService = TestBed.inject(TenantService);
  }

  beforeEach(() => {
    setup({ auth: false, passwordRecovery: false });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('reports not authenticated initially', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('hasRole returns false when unauthenticated', () => {
    expect(service.hasRole('COORDINATOR')).toBe(false);
  });

  it('currentUser$ emits null initially', async () => {
    await expect(firstValueFrom(service.currentUser$)).resolves.toBeNull();
  });

  it('login stores token in memory, emits user, and sets tenant context', async () => {
    const accessToken = createTestJwt({
      sub: '7',
      role: 'COORDINATOR',
      graduateProgramId: 3,
    });

    const loginPromise = firstValueFrom(service.login('coord@uam.mx', 'secret', true));

    const req = httpMock.expectOne(LOGIN_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toMatchObject({
      email: 'coord@uam.mx',
      password: 'secret',
      rememberMe: true,
    });

    req.flush({
      accessToken,
      expiresIn: 900,
      role: 'COORDINATOR',
    });

    await loginPromise;

    expect(service.isAuthenticated()).toBe(true);
    expect(service.getAccessToken()).toBe(accessToken);
    expect(service.hasRole('COORDINATOR')).toBe(true);
    expect(service.hasRole('STUDENT')).toBe(false);
    expect(tenantService.get()).toBe(3);

    const user = await firstValueFrom(service.currentUser$);
    expect(user).toEqual({
      id: 7,
      email: 'coord@uam.mx',
      role: 'COORDINATOR',
      graduateProgramId: 3,
    });
  });

  it('login keeps tenant null for SYSTEM_ADMIN without graduate program claim', async () => {
    const accessToken = createTestJwt({
      sub: '5',
      role: 'SYSTEM_ADMIN',
      graduateProgramId: null,
    });

    const loginPromise = firstValueFrom(service.login('system_admin@uam.mx', 'secret'));
    const req = httpMock.expectOne(LOGIN_URL);
    req.flush({ accessToken, expiresIn: 900, role: 'SYSTEM_ADMIN' });

    await loginPromise;

    expect(service.getCurrentUser()).toEqual({
      id: 5,
      email: 'system_admin@uam.mx',
      role: 'SYSTEM_ADMIN',
      graduateProgramId: null,
    });
    expect(tenantService.get()).toBeNull();
  });

  it('uses auth mock when only auth mock is enabled', async () => {
    TestBed.resetTestingModule();
    setup({ auth: true, passwordRecovery: false });

    await firstValueFrom(service.login('student@uam.mx', 'password'));

    expect(service.getCurrentUser()?.role).toBe('STUDENT');
    expect(service.getAccessToken()).toContain('.');
    httpMock.expectNone(LOGIN_URL);
  });

  it('requestPasswordReset calls backend when password recovery mock is disabled', async () => {
    const resetPromise = firstValueFrom(service.requestPasswordReset('student@uam.mx'));

    const req = httpMock.expectOne(FORGOT_PASSWORD_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual({ email: 'student@uam.mx' });
    req.flush(null);

    await resetPromise;
  });

  it('requestPasswordReset uses password recovery mock independently from auth mock', async () => {
    TestBed.resetTestingModule();
    setup({ auth: false, passwordRecovery: true });

    await firstValueFrom(service.requestPasswordReset('student@uam.mx'));

    httpMock.expectNone(FORGOT_PASSWORD_URL);
  });

  it('logout clears session and tenant context', async () => {
    const accessToken = createTestJwt({
      sub: '1',
      role: 'STUDENT',
      graduateProgramId: 2,
    });

    const loginPromise = firstValueFrom(service.login('student@uam.mx', 'secret'));
    const req = httpMock.expectOne(LOGIN_URL);
    req.flush({ accessToken, expiresIn: 900, role: 'STUDENT' });
    await loginPromise;

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.getAccessToken()).toBeNull();
    expect(tenantService.get()).toBeNull();
    await expect(firstValueFrom(service.currentUser$)).resolves.toBeNull();
  });
});
