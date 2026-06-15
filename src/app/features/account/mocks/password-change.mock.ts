import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

import { AcademicCatalogMockStore } from '../../academic-catalog/mocks/academic-catalog-mock.store';

export function mockChangePassword(
  store: AcademicCatalogMockStore,
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
  if (!selfChange && !store.hasUser(userId)) {
    return throwError(
      () => new HttpErrorResponse({ status: 404, error: { error: 'USER_NOT_FOUND' } }),
    );
  }
  return of(void 0);
}
