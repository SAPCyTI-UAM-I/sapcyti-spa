import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { CurrentUser } from '../../../models';
import { AuthStateService } from '../auth.service';
import { guestAuthGuard } from './guest-auth.guard';

describe('guestAuthGuard', () => {
  let authState: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    getCurrentUser: ReturnType<typeof vi.fn>;
  };
  let router: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authState = {
      isAuthenticated: vi.fn(() => false),
      getCurrentUser: vi.fn(() => null),
    };
    router = {
      createUrlTree: vi.fn((commands: unknown[]) => ({ commands })),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStateService, useValue: authState },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('allows unauthenticated users to open login', () => {
    const result = TestBed.runInInjectionContext(() => guestAuthGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('redirects authenticated users to dashboard', () => {
    authState.isAuthenticated.mockReturnValue(true);
    authState.getCurrentUser.mockReturnValue({
      id: 1,
      email: 'coord@uam.mx',
      role: 'COORDINATOR',
      graduateProgramId: 1,
    } satisfies CurrentUser);

    const result = TestBed.runInInjectionContext(() => guestAuthGuard({} as never, {} as never));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toEqual({ commands: ['/dashboard'] });
  });

  it('redirects authenticated SPEAKER to dashboard', () => {
    authState.isAuthenticated.mockReturnValue(true);
    authState.getCurrentUser.mockReturnValue({
      id: 2,
      email: 'speaker@uam.mx',
      role: 'SPEAKER',
      graduateProgramId: 1,
    } satisfies CurrentUser);

    TestBed.runInInjectionContext(() => guestAuthGuard({} as never, {} as never));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });
});
