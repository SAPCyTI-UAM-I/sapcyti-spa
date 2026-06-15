import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

import { API_ENDPOINTS } from '../../api/api-endpoints';
import { AuthResponse } from '../../../models/auth-response.model';
import { AuthApiRepository } from './auth-api.repository';

@Injectable()
export class AuthApiHttpRepository implements AuthApiRepository {
  readonly supportsRememberedSessionRestore = true;
  readonly supportsSilentRefresh = true;
  private readonly http = inject(HttpClient);

  login(email: string, password: string, rememberMe: boolean): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      API_ENDPOINTS.auth.login,
      {
        email,
        password,
        rememberMe,
        deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      },
      { withCredentials: true },
    );
  }

  refresh(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(API_ENDPOINTS.auth.refresh, {}, { withCredentials: true });
  }

  logout(): Observable<void> {
    return this.http.post<void>(API_ENDPOINTS.auth.logout, {}, { withCredentials: true }).pipe(
      map(() => void 0),
      catchError(() => of(void 0)),
    );
  }
}
