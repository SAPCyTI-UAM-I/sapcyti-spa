import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

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
          error: { error: 'CURRENT_PASSWORD_INCORRECT' },
        }),
    );
  }
  if (!selfChange && !studentRegistry.hasUser(userId) && !professorRegistry.hasUser(userId)) {
    return throwError(
      () => new HttpErrorResponse({ status: 404, error: { error: 'USER_NOT_FOUND' } }),
    );
  }
  return of(void 0);
}
