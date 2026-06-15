import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthStateService } from '../auth/auth.service';
import { httpErrorInterceptor } from './http-error.interceptor';

describe('httpErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authState: {
    logout: ReturnType<typeof vi.fn>;
    silentRefresh: ReturnType<typeof vi.fn>;
  };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authState = {
      logout: vi.fn(() => of(void 0)),
      silentRefresh: vi.fn(() => of(void 0)),
    };
    router = { navigateByUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthStateService, useValue: authState },
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('propagates HTTP errors', () => {
    let captured: HttpErrorResponse | undefined;

    http.get('/api/test').subscribe({
      error: (error: HttpErrorResponse) => {
        captured = error;
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.flush('fail', { status: 500, statusText: 'Server Error' });

    expect(captured?.status).toBe(500);
  });

  it('does not logout or redirect when refresh returns 401', () => {
    let captured: HttpErrorResponse | undefined;

    http.post('/api/auth/refresh', {}).subscribe({
      error: (error: HttpErrorResponse) => {
        captured = error;
      },
    });

    const req = httpMock.expectOne('/api/auth/refresh');
    req.flush('fail', { status: 401, statusText: 'Unauthorized' });

    expect(captured?.status).toBe(401);
    expect(authState.logout).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('retries request once after successful silent refresh on 401', () => {
    let response: unknown;

    http.get('/api/protected').subscribe((value) => {
      response = value;
    });

    const req = httpMock.expectOne('/api/protected');
    req.flush('expired', { status: 401, statusText: 'Unauthorized' });

    const retriedReq = httpMock.expectOne((candidate) => {
      return (
        candidate.url === '/api/protected' && candidate.headers.get('x-sapcyti-auth-retry') === '1'
      );
    });
    retriedReq.flush({ ok: true });

    expect(authState.silentRefresh).toHaveBeenCalledTimes(1);
    expect(authState.logout).not.toHaveBeenCalled();
    expect(response).toEqual({ ok: true });
  });

  it('logs out and redirects when silent refresh fails for a protected 401', () => {
    authState.silentRefresh.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
    );
    let captured: HttpErrorResponse | undefined;

    http.get('/api/protected').subscribe({
      error: (error: HttpErrorResponse) => {
        captured = error;
      },
    });

    const req = httpMock.expectOne('/api/protected');
    req.flush('expired', { status: 401, statusText: 'Unauthorized' });

    expect(authState.silentRefresh).toHaveBeenCalledTimes(1);
    expect(authState.logout).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
    expect(captured?.status).toBe(401);
  });
});
