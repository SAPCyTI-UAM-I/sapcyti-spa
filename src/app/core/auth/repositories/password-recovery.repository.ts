import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface PasswordRecoveryRepository {
  requestPasswordReset(email: string): Observable<void>;
  resetPassword(token: string, newPassword: string): Observable<void>;
}

export const PASSWORD_RECOVERY_REPOSITORY = new InjectionToken<PasswordRecoveryRepository>(
  'PasswordRecoveryRepository',
);
