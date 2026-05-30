import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

import { CurrentUser } from '../../models/current-user.model';
import { AuthStateService } from './auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authState: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    getCurrentUser: ReturnType<typeof vi.fn>;
  };
  let router: { createUrlTree: ReturnType<typeof vi.fn> };

  const runGuard = (roles?: string[]) => {
    const route = { data: roles ? { roles } : {} } as ActivatedRouteSnapshot;
    const state = { url: '/enrollment' } as RouterStateSnapshot;

    return TestBed.runInInjectionContext(() => authGuard(route, state));
  };

  beforeEach(() => {
    authState = {
      isAuthenticated: vi.fn(() => false),
      getCurrentUser: vi.fn(() => null),
    };
    router = {
      createUrlTree: vi.fn((commands: unknown[], extras?: { queryParams?: unknown }) => ({
        commands,
        extras,
      })),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStateService, useValue: authState },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('redirects unauthenticated users to login with returnUrl', () => {
    const result = runGuard();

    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/enrollment' },
    });
    expect(result).toEqual({
      commands: ['/auth/login'],
      extras: { queryParams: { returnUrl: '/enrollment' } },
    });
  });

  it('allows SPEAKER on speaker routes', () => {
    authState.isAuthenticated.mockReturnValue(true);
    authState.getCurrentUser.mockReturnValue({
      id: 1,
      email: 'speaker@uam.mx',
      role: 'SPEAKER',
      graduateProgramId: 1,
    } satisfies CurrentUser);

    const result = runGuard(['SPEAKER']);

    expect(result).toBe(true);
  });

  it('redirects SPEAKER from routes without permission', () => {
    authState.isAuthenticated.mockReturnValue(true);
    authState.getCurrentUser.mockReturnValue({
      id: 1,
      email: 'speaker@uam.mx',
      role: 'SPEAKER',
      graduateProgramId: 1,
    } satisfies CurrentUser);

    const result = runGuard(['COORDINATOR']);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/access-denied']);
    expect(result).toEqual({ commands: ['/access-denied'], extras: undefined });
  });

  it('redirects users with insufficient role to access-denied', () => {
    authState.isAuthenticated.mockReturnValue(true);
    authState.getCurrentUser.mockReturnValue({
      id: 2,
      email: 'student@uam.mx',
      role: 'STUDENT',
      graduateProgramId: 1,
    } satisfies CurrentUser);

    runGuard(['COORDINATOR']);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/access-denied']);
  });

  it('redirects SYSTEM_ADMIN from COORDINATOR-only routes', () => {
    authState.isAuthenticated.mockReturnValue(true);
    authState.getCurrentUser.mockReturnValue({
      id: 3,
      email: 'admin@uam.mx',
      role: 'SYSTEM_ADMIN',
      graduateProgramId: 1,
    } satisfies CurrentUser);

    const result = runGuard(['COORDINATOR', 'ASSISTANT']);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/access-denied']);
    expect(result).toEqual({ commands: ['/access-denied'], extras: undefined });
  });

  it('allows SYSTEM_ADMIN when route explicitly includes it', () => {
    authState.isAuthenticated.mockReturnValue(true);
    authState.getCurrentUser.mockReturnValue({
      id: 3,
      email: 'admin@uam.mx',
      role: 'SYSTEM_ADMIN',
      graduateProgramId: null,
    } satisfies CurrentUser);

    expect(runGuard(['SYSTEM_ADMIN'])).toBe(true);
  });

  it('allows authenticated users when route has no role metadata', () => {
    authState.isAuthenticated.mockReturnValue(true);
    authState.getCurrentUser.mockReturnValue({
      id: 4,
      email: 'student@uam.mx',
      role: 'STUDENT',
      graduateProgramId: 1,
    } satisfies CurrentUser);

    expect(runGuard()).toBe(true);
  });
});
