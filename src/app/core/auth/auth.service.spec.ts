import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { TenantService } from '../http/tenant.service';
import { DATA_LAYER_PROVIDERS } from '../api/data-layer.providers';
import { provideAppMockConfig } from '../mocks/mock.config';
import { AuthStateService } from './auth.service';
import {
  AUTH_STORAGE_KEYS,
  AUTH_TEST_ENDPOINTS,
  clearAuthStorage,
  createTestJwt,
} from '../../testing/auth-test.util';

describe('AuthStateService', () => {
  let service: AuthStateService;
  let httpMock: HttpTestingController;
  let tenantService: TenantService;

  function setup(mocks: { auth?: boolean; passwordRecovery?: boolean } = { auth: false }): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppMockConfig(mocks),
        ...DATA_LAYER_PROVIDERS,
      ],
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
    clearAuthStorage();
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

    const req = httpMock.expectOne(AUTH_TEST_ENDPOINTS.login);
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
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.rememberSession)).toBe('true');
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.rememberedEmail)).toBe('coord@uam.mx');

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
    const req = httpMock.expectOne(AUTH_TEST_ENDPOINTS.login);
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

  it('login clears remembered session when remember me is false', async () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.rememberSession, 'true');
    localStorage.setItem(AUTH_STORAGE_KEYS.rememberedEmail, 'previous@uam.mx');
    const accessToken = createTestJwt({
      sub: '1',
      role: 'STUDENT',
      graduateProgramId: 2,
    });

    const loginPromise = firstValueFrom(service.login('student@uam.mx', 'secret', false));
    const req = httpMock.expectOne(AUTH_TEST_ENDPOINTS.login);
    req.flush({ accessToken, expiresIn: 900, role: 'STUDENT' });
    await loginPromise;

    expect(localStorage.getItem(AUTH_STORAGE_KEYS.rememberSession)).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.rememberedEmail)).toBeNull();
  });

  it('does not restore a session when remember me was not selected', async () => {
    await firstValueFrom(service.restoreRememberedSession());

    httpMock.expectNone(AUTH_TEST_ENDPOINTS.refresh);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('restores a remembered session using the refresh endpoint', async () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.rememberSession, 'true');
    localStorage.setItem(AUTH_STORAGE_KEYS.rememberedEmail, 'coord@uam.mx');
    const accessToken = createTestJwt({
      sub: '7',
      role: 'COORDINATOR',
      graduateProgramId: 3,
    });

    const restorePromise = firstValueFrom(service.restoreRememberedSession());
    const req = httpMock.expectOne(AUTH_TEST_ENDPOINTS.refresh);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual({});

    req.flush({ accessToken, expiresIn: 900, role: 'COORDINATOR' });
    await restorePromise;

    expect(service.isAuthenticated()).toBe(true);
    expect(service.getAccessToken()).toBe(accessToken);
    expect(service.getCurrentUser()).toEqual({
      id: 7,
      email: 'coord@uam.mx',
      role: 'COORDINATOR',
      graduateProgramId: 3,
    });
    expect(tenantService.get()).toBe(3);
  });

  it('clears remembered session when refresh is rejected', async () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.rememberSession, 'true');
    localStorage.setItem(AUTH_STORAGE_KEYS.rememberedEmail, 'coord@uam.mx');

    const restorePromise = firstValueFrom(service.restoreRememberedSession());
    const req = httpMock.expectOne(AUTH_TEST_ENDPOINTS.refresh);
    req.flush({ message: 'Invalid refresh token' }, { status: 401, statusText: 'Unauthorized' });
    await restorePromise;

    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.rememberSession)).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.rememberedEmail)).toBeNull();
  });

  it('uses auth mock when only auth mock is enabled', async () => {
    TestBed.resetTestingModule();
    setup({ auth: true, passwordRecovery: false });

    await firstValueFrom(service.login('student@uam.mx', 'password'));

    expect(service.getCurrentUser()?.role).toBe('STUDENT');
    expect(service.getAccessToken()).toContain('.');
    httpMock.expectNone(AUTH_TEST_ENDPOINTS.login);
  });

  it('silentRefresh updates access token and user context', async () => {
    const initialToken = createTestJwt({
      sub: '1',
      role: 'STUDENT',
      graduateProgramId: 2,
    });
    const refreshedToken = createTestJwt({
      sub: '1',
      role: 'STUDENT',
      graduateProgramId: 2,
      exp: Math.floor(Date.now() / 1000) + 900,
    });

    const loginPromise = firstValueFrom(service.login('student@uam.mx', 'secret'));
    const loginReq = httpMock.expectOne(AUTH_TEST_ENDPOINTS.login);
    loginReq.flush({ accessToken: initialToken, expiresIn: 900, role: 'STUDENT' });
    await loginPromise;

    const refreshPromise = firstValueFrom(service.silentRefresh());
    const refreshReq = httpMock.expectOne(AUTH_TEST_ENDPOINTS.refresh);
    expect(refreshReq.request.method).toBe('POST');
    expect(refreshReq.request.withCredentials).toBe(true);
    refreshReq.flush({ accessToken: refreshedToken, expiresIn: 900, role: 'STUDENT' });
    await refreshPromise;

    expect(service.getAccessToken()).toBe(refreshedToken);
    expect(service.getCurrentUser()?.email).toBe('student@uam.mx');
  });

  it('silentRefresh logs out and rethrows when refresh fails', async () => {
    const initialToken = createTestJwt({
      sub: '1',
      role: 'STUDENT',
      graduateProgramId: 2,
    });

    const loginPromise = firstValueFrom(service.login('student@uam.mx', 'secret'));
    const loginReq = httpMock.expectOne(AUTH_TEST_ENDPOINTS.login);
    loginReq.flush({ accessToken: initialToken, expiresIn: 900, role: 'STUDENT' });
    await loginPromise;

    const refreshPromise = firstValueFrom(service.silentRefresh());
    const refreshReq = httpMock.expectOne(AUTH_TEST_ENDPOINTS.refresh);
    refreshReq.flush(
      { message: 'Invalid refresh token' },
      { status: 401, statusText: 'Unauthorized' },
    );

    const logoutReq = httpMock.expectOne(AUTH_TEST_ENDPOINTS.logout);
    expect(logoutReq.request.method).toBe('POST');
    logoutReq.flush(null);

    await expect(refreshPromise).rejects.toBeTruthy();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('logout calls backend and clears session and tenant context', async () => {
    const accessToken = createTestJwt({
      sub: '1',
      role: 'STUDENT',
      graduateProgramId: 2,
    });

    const loginPromise = firstValueFrom(service.login('student@uam.mx', 'secret'));
    const req = httpMock.expectOne(AUTH_TEST_ENDPOINTS.login);
    req.flush({ accessToken, expiresIn: 900, role: 'STUDENT' });
    await loginPromise;

    const logoutPromise = firstValueFrom(service.logout());
    const logoutReq = httpMock.expectOne(AUTH_TEST_ENDPOINTS.logout);
    expect(logoutReq.request.method).toBe('POST');
    expect(logoutReq.request.withCredentials).toBe(true);
    logoutReq.flush(null);
    await logoutPromise;

    expect(service.isAuthenticated()).toBe(false);
    expect(service.getAccessToken()).toBeNull();
    expect(tenantService.get()).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.rememberSession)).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.rememberedEmail)).toBeNull();
    await expect(firstValueFrom(service.currentUser$)).resolves.toBeNull();
  });
});
