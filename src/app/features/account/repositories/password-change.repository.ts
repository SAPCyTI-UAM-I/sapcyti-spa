import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword: string;
}

export interface PasswordChangeRepository {
  changePassword(
    userId: number,
    request: ChangePasswordRequest,
    selfChange: boolean,
  ): Observable<void>;
}

export const PASSWORD_CHANGE_REPOSITORY = new InjectionToken<PasswordChangeRepository>(
  'PasswordChangeRepository',
);
