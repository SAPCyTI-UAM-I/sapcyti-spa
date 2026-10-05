import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { ChangePasswordRequest, PasswordChangeRepository } from './password-change.repository';

@Injectable()
export class PasswordChangeHttpRepository implements PasswordChangeRepository {
  private readonly http = inject(HttpClient);

  changePassword(
    userId: number,
    request: ChangePasswordRequest,
    _selfChange: boolean,
  ): Observable<void> {
    void _selfChange;
    return this.http.put<void>(API_ENDPOINTS.userPassword(userId), request, {
      withCredentials: true,
    });
  }
}
