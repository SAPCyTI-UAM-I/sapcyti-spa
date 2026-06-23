import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { PasswordRecoveryService } from './password-recovery.service';
import { AUTH_TEST_ENDPOINTS, configureAuthHttpTesting } from '../../testing/auth-test.util';

describe('PasswordRecoveryService', () => {
  let service: PasswordRecoveryService;
  let httpMock: ReturnType<typeof configureAuthHttpTesting>['httpMock'];

  function setup(
    mocks: { auth?: boolean; passwordRecovery?: boolean } = { passwordRecovery: false },
  ): void {
    ({ httpMock } = configureAuthHttpTesting(mocks));
    service = TestBed.inject(PasswordRecoveryService);
  }

  beforeEach(() => {
    setup({ auth: false, passwordRecovery: false });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requestPasswordReset calls backend when mock is disabled', async () => {
    const resetPromise = firstValueFrom(service.requestPasswordReset('student@uam.mx'));

    const req = httpMock.expectOne(AUTH_TEST_ENDPOINTS.forgotPassword);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual({ email: 'student@uam.mx' });
    req.flush({ message: 'If an account with that email exists, a recovery email has been sent' });

    await resetPromise;
  });

  it('requestPasswordReset uses mock independently from auth mock', async () => {
    TestBed.resetTestingModule();
    setup({ auth: false, passwordRecovery: true });

    await firstValueFrom(service.requestPasswordReset('student@uam.mx'));

    httpMock.expectNone(AUTH_TEST_ENDPOINTS.forgotPassword);
  });

  it('resetPassword calls backend when mock is disabled', async () => {
    const resetPromise = firstValueFrom(service.resetPassword('valid-token', 'NewS3cur3!Pass'));

    const req = httpMock.expectOne(AUTH_TEST_ENDPOINTS.resetPassword);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual({ token: 'valid-token', newPassword: 'NewS3cur3!Pass' });
    req.flush(null);

    await resetPromise;
  });

  it('resetPassword uses mock independently from auth mock', async () => {
    TestBed.resetTestingModule();
    setup({ auth: false, passwordRecovery: true });

    await firstValueFrom(service.resetPassword('mock-valid-reset-token', 'NewS3cur3!Pass'));

    httpMock.expectNone(AUTH_TEST_ENDPOINTS.resetPassword);
  });
});
