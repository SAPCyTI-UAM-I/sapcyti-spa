import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { mockRequestPasswordReset, mockResetPassword } from '../mock/auth.mock';
import { PasswordRecoveryRepository } from './password-recovery.repository';

@Injectable()
export class PasswordRecoveryMockRepository implements PasswordRecoveryRepository {
  requestPasswordReset(email: string): Observable<void> {
    return mockRequestPasswordReset(email);
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return mockResetPassword(token, newPassword);
  }
}
