import { Observable, of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { BACKEND_MESSAGES } from '../../../core/errors/constants/backend-messages';
import { MockUserRegistry } from '../../../core/mocks/mock-user-registry';

export function mockChangePassword(
  studentRegistry: MockUserRegistry,
  professorRegistry: MockUserRegistry,
  userId: number,
  currentPassword: string | undefined,
  selfChange: boolean,
): Observable<void> {
  if (selfChange && currentPassword !== 'password') {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 400,
          error: {
            error: 'VALIDATION_ERROR',
            message: BACKEND_MESSAGES.IDENTITY.CURRENT_PASSWORD_INCORRECT,
          },
        }),
    );
  }
  if (!selfChange && !studentRegistry.hasUser(userId) && !professorRegistry.hasUser(userId)) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 404,
          error: { error: 'NOT_FOUND', message: BACKEND_MESSAGES.IDENTITY.USER_NOT_FOUND },
        }),
    );
  }
  return of(void 0);
}
