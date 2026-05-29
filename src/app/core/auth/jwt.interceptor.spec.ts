import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { LANGUAGE_STORAGE_KEY } from '../i18n/language.constants';
import { AuthStateService } from './auth.service';
import { jwtInterceptor } from './jwt.interceptor';

const API_URL = 'http://localhost:8080/api/test';
const LOGIN_URL = 'http://localhost:8080/api/auth/login';

describe('jwtInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authState: { getAccessToken: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authState = {
      getAccessToken: vi.fn(() => null),
    };

    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthStateService, useValue: authState },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  });

  it('injects Accept-Language header from stored language preference', () => {
    http.get(API_URL).subscribe();
    const req = httpMock.expectOne(API_URL);
    expect(req.request.headers.get('Accept-Language')).toBe('en');
    req.flush({});
  });

  it('enables withCredentials for API requests', () => {
    http.get(API_URL).subscribe();
    const req = httpMock.expectOne(API_URL);
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('does not enable withCredentials for non-API requests', () => {
    http.get('/assets/i18n/es.json').subscribe();
    const req = httpMock.expectOne('/assets/i18n/es.json');
    expect(req.request.withCredentials).toBe(false);
    req.flush({});
  });

  it('attaches Bearer token when authenticated', () => {
    authState.getAccessToken.mockReturnValue('test-access-token');

    http.get(API_URL).subscribe();
    const req = httpMock.expectOne(API_URL);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-access-token');
    req.flush({});
  });

  it('does not attach Bearer token to login requests', () => {
    authState.getAccessToken.mockReturnValue('test-access-token');

    http.post(LOGIN_URL, {}).subscribe();
    const req = httpMock.expectOne(LOGIN_URL);
    expect(req.request.headers.get('Authorization')).toBeNull();
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });
});
