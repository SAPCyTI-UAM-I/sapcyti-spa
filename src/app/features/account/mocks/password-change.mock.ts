import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

import { ProfessorMockStore } from '../../academic-catalog/mocks/professor-mock.store';
import { StudentMockStore } from '../../academic-catalog/mocks/student-mock.store';

export function mockChangePassword(
  studentStore: StudentMockStore,
  professorStore: ProfessorMockStore,
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
  if (!selfChange && !studentStore.hasUser(userId) && !professorStore.hasUser(userId)) {
    return throwError(
      () => new HttpErrorResponse({ status: 404, error: { error: 'USER_NOT_FOUND' } }),
    );
  }
  return of(void 0);
}
