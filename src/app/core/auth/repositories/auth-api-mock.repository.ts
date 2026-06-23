import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import { AuthResponse } from '../../../models';
import { mockLogin } from '../mock/auth.mock';
import { AuthApiRepository } from './auth-api.repository';

@Injectable()
export class AuthApiMockRepository implements AuthApiRepository {
  readonly supportsRememberedSessionRestore = false;
  readonly supportsSilentRefresh = false;

  login(email: string, password: string, _rememberMe: boolean): Observable<AuthResponse> {
    void _rememberMe;
    return mockLogin(email, password);
  }

  refresh(): Observable<AuthResponse> {
    return throwError(() => new Error('Auth mock does not support refresh'));
  }

  logout(): Observable<void> {
    return of(void 0);
  }
}
