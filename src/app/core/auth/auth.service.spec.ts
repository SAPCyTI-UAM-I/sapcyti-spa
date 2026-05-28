import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AuthStateService } from './auth.service';

describe('AuthStateService', () => {
  let service: AuthStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthStateService);
  });

  it('reports not authenticated in stub phase', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('hasRole returns false in stub phase', () => {
    expect(service.hasRole('COORDINATOR')).toBe(false);
  });

  it('currentUser$ emits null initially', async () => {
    await expect(firstValueFrom(service.currentUser$)).resolves.toBeNull();
  });
});
