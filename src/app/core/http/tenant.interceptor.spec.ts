import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { tenantInterceptor } from './tenant.interceptor';
import { TenantService } from './tenant.service';

describe('tenantInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tenantService: TenantService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([tenantInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tenantService = TestBed.inject(TenantService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('attaches X-Graduate-Id when tenant is set', () => {
    tenantService.set(42);
    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('X-Graduate-Id')).toBe('42');
    req.flush({});
  });

  it('skips X-Graduate-Id when tenant is null', () => {
    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('X-Graduate-Id')).toBe(false);
    req.flush({});
  });
});
