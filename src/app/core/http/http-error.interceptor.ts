import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';

import { AuthStateService } from '../auth/auth.service';

function isAuthSessionRequest(url: string): boolean {
  return (
    url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout')
  );
}

const RETRY_HEADER = 'x-sapcyti-auth-retry';
let refreshInFlight$: ReturnType<AuthStateService['silentRefresh']> | null = null;

function getRefreshInFlight(auth: AuthStateService) {
  if (!refreshInFlight$) {
    refreshInFlight$ = auth.silentRefresh().pipe(
      finalize(() => {
        refreshInFlight$ = null;
      }),
      shareReplay(1),
    );
  }
  return refreshInFlight$;
}

function logoutAndRedirectWithError(
  auth: AuthStateService,
  router: Router,
  error: HttpErrorResponse,
) {
  return auth.logout().pipe(
    switchMap(() => {
      void router.navigateByUrl('/auth/login');
      return throwError(() => error);
    }),
  );
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStateService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthSessionRequest(req.url)) {
        if (req.headers.has(RETRY_HEADER)) {
          return logoutAndRedirectWithError(auth, router, error);
        }

        return getRefreshInFlight(auth).pipe(
          switchMap(() =>
            next(
              req.clone({
                headers: req.headers.set(RETRY_HEADER, '1'),
              }),
            ),
          ),
          catchError(() => logoutAndRedirectWithError(auth, router, error)),
        );
      }

      if (error.status === 403) {
        void router.navigateByUrl('/access-denied');
      }

      return throwError(() => error);
    }),
  );
};
