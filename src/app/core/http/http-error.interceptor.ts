import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthStateService } from '../auth/auth.service';

function isAuthLoginRequest(url: string): boolean {
  return url.includes('/auth/login');
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStateService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthLoginRequest(req.url)) {
        auth.logout();
        void router.navigateByUrl('/auth/login');
      }

      if (error.status === 403) {
        void router.navigateByUrl('/access-denied');
      }

      return throwError(() => error);
    }),
  );
};
