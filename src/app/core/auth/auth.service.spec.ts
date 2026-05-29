import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { TenantService } from '../http/tenant.service';
import { AUTH_USE_MOCK } from './auth.config';
import { AuthStateService } from './auth.service';

const LOGIN_URL = 'http://localhost:8080/api/auth/login';

function createTestJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.test-signature`;
}

describe('AuthStateService', () => {
  let service: AuthStateService;
  let httpMock: HttpTestingController;
  let tenantService: TenantService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AUTH_USE_MOCK, useValue: false },
      ],
    });

    service = TestBed.inject(AuthStateService);
    httpMock = TestBed.inject(HttpTestingController);
    tenantService = TestBed.inject(TenantService);
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
