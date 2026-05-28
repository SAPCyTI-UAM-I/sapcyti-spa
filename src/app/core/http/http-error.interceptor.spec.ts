import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { httpErrorInterceptor } from './http-error.interceptor';

describe('httpErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
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
});
