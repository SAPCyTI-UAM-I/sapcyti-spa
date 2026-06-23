import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ChangePasswordRequest,
  PASSWORD_CHANGE_REPOSITORY,
} from '../repositories/password-change.repository';

export type { ChangePasswordRequest } from '../repositories/password-change.repository';

@Injectable({ providedIn: 'root' })
export class PasswordChangeService {
  private readonly repository = inject(PASSWORD_CHANGE_REPOSITORY);

  changePassword(
    userId: number,
    request: ChangePasswordRequest,
    selfChange: boolean,
  ): Observable<void> {
    return this.repository.changePassword(userId, request, selfChange);
  }
}
