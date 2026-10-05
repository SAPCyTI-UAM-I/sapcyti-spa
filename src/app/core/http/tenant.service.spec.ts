import { TestBed } from '@angular/core/testing';

import { TenantService } from './tenant.service';

describe('TenantService', () => {
  let service: TenantService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TenantService);
  });

  it('starts with null graduate program id', () => {
    expect(service.get()).toBeNull();
  });

  it('set stores graduate program id', () => {
    service.set(7);
    expect(service.get()).toBe(7);
  });

  it('clear resets graduate program id', () => {
    service.set(7);
    service.clear();
    expect(service.get()).toBeNull();
  });
});
