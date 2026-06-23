import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../api/api-endpoints';
import { PasswordRecoveryRepository } from './password-recovery.repository';

interface ForgotPasswordResponse {
  message: string;
}

@Injectable()
export class PasswordRecoveryHttpRepository implements PasswordRecoveryRepository {
  private readonly http = inject(HttpClient);

  requestPasswordReset(email: string): Observable<void> {
    return this.http
      .post<ForgotPasswordResponse>(
        API_ENDPOINTS.auth.forgotPassword,
        { email },
        { withCredentials: true },
      )
      .pipe(map(() => void 0));
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(
        API_ENDPOINTS.auth.resetPassword,
        { token, newPassword },
        { withCredentials: true },
      )
      .pipe(map(() => void 0));
  }
}
