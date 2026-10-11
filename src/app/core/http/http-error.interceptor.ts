import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';

import { isAuthSessionRequest } from '../auth/auth.endpoints';
import { AuthStateService } from '../auth/auth.service';
import { getApiErrorCode } from '../errors/utils/parse-api-error.util';
import { EXAM_STUDENT_OPERATION } from './tokens/exam-context.tokens';

const EXAM_TYPE = 'GRADO|PREDOCTORAL';
const DOCUMENT_TYPE = 'TESIS|ARTICULO|SOL_SINODALES|HIST_ACAD|COMP_IDIOMA|DATOS_ALUM';

/** Escrituras de alumno bajo /api/exam-requests; enums válidos únicamente. */
const EXAM_STUDENT_WRITE_PATTERNS: Readonly<Record<string, readonly RegExp[]>> = {
  POST: [
    new RegExp(`^/api/exam-requests/me/(?:${EXAM_TYPE})/documents/?$`),
    new RegExp(`^/api/exam-requests/me/(?:${EXAM_TYPE})/submit/?$`),
  ],
  PUT: [
    new RegExp(`^/api/exam-requests/me/(?:${EXAM_TYPE})/documents/(?:${DOCUMENT_TYPE})/?$`),
    new RegExp(`^/api/exam-requests/me/(?:${EXAM_TYPE})/updates/?$`),
  ],
  DELETE: [new RegExp(`^/api/exam-requests/me/(?:${EXAM_TYPE})/documents/(?:${DOCUMENT_TYPE})/?$`)],
};

function resolveRequestPath(url: string): string {
  try {
    return new URL(url, 'http://local.invalid').pathname;
  } catch {
    return url.split('?')[0] ?? url;
  }
}

function isExamStudentWriteRequest(method: string, url: string): boolean {
  const patterns = EXAM_STUDENT_WRITE_PATTERNS[method.toUpperCase()];
  if (!patterns) {
    return false;
  }

  return patterns.some((pattern) => pattern.test(resolveRequestPath(url)));
}

/** Conserva PROGRAM_NOT_ELIGIBLE en pantalla solo si coinciden todas las condiciones. */
function shouldKeepProgramNotEligibleOnScreen(
  req: HttpRequest<unknown>,
  error: HttpErrorResponse,
  auth: AuthStateService,
): boolean {
  return (
    error.status === 403 &&
    getApiErrorCode(error) === 'PROGRAM_NOT_ELIGIBLE' &&
    auth.hasRole('STUDENT') &&
    req.context.get(EXAM_STUDENT_OPERATION) === true &&
    isExamStudentWriteRequest(req.method, req.url)
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

      if (error.status === 403 && !shouldKeepProgramNotEligibleOnScreen(req, error, auth)) {
        void router.navigateByUrl('/access-denied');
      }

      return throwError(() => error);
    }),
  );
};
