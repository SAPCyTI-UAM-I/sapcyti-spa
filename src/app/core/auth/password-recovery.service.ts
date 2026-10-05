import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PASSWORD_RECOVERY_REPOSITORY } from './repositories/password-recovery.repository';

@Injectable({ providedIn: 'root' })
export class PasswordRecoveryService {
  private readonly repository = inject(PASSWORD_RECOVERY_REPOSITORY);

  requestPasswordReset(email: string): Observable<void> {
    return this.repository.requestPasswordReset(email);
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.repository.resetPassword(token, newPassword);
  }
}
