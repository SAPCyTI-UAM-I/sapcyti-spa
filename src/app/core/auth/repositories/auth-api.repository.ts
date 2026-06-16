import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthResponse } from '../../../models';

export interface AuthApiRepository {
  readonly supportsRememberedSessionRestore: boolean;
  readonly supportsSilentRefresh: boolean;
  login(email: string, password: string, rememberMe: boolean): Observable<AuthResponse>;
  refresh(): Observable<AuthResponse>;
  logout(): Observable<void>;
}

export const AUTH_API_REPOSITORY = new InjectionToken<AuthApiRepository>('AuthApiRepository');
