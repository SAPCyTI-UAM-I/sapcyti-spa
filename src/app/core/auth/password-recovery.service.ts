import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { injectMockEnabled } from '../mocks/mock.config';
import { AUTH_ENDPOINTS } from './auth.endpoints';
import { mockRequestPasswordReset, mockResetPassword } from './mock/auth.mock';

interface ForgotPasswordResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PasswordRecoveryService {
  private readonly http = inject(HttpClient);
  private readonly useMock = injectMockEnabled('passwordRecovery');

  requestPasswordReset(email: string): Observable<void> {
    if (this.useMock) {
      return mockRequestPasswordReset(email);
    }

    return this.http
      .post<ForgotPasswordResponse>(
        AUTH_ENDPOINTS.forgotPassword,
        { email },
        { withCredentials: true },
      )
      .pipe(map(() => void 0));
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    if (this.useMock) {
      return mockResetPassword(token, newPassword);
    }

    return this.http
      .post<void>(
        AUTH_ENDPOINTS.resetPassword,
        { token, newPassword },
        { withCredentials: true },
      )
      .pipe(map(() => void 0));
  }
}
