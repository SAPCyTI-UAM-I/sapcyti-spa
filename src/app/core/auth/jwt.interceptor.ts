import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { getRequestLanguage } from '../i18n/request-language.util';
import { AuthStateService } from './auth.service';

function isApiRequest(url: string): boolean {
  return url.startsWith(environment.apiBaseUrl) || url.startsWith('/api/');
}

function isAuthLoginRequest(url: string): boolean {
  return url.includes('/auth/login');
}

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStateService);
  const lang = getRequestLanguage();

  let headers = req.headers.set('Accept-Language', lang);
  const token = auth.getAccessToken();

  if (token && isApiRequest(req.url) && !isAuthLoginRequest(req.url)) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  return next(
    req.clone({
      headers,
      withCredentials: isApiRequest(req.url),
    }),
  );
};
