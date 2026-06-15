import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ProfessorMockStore } from '../../academic-catalog/mocks/professor-mock.store';
import { StudentMockStore } from '../../academic-catalog/mocks/student-mock.store';
import { mockChangePassword } from '../mocks/password-change.mock';
import { ChangePasswordRequest, PasswordChangeRepository } from './password-change.repository';

@Injectable()
export class PasswordChangeMockRepository implements PasswordChangeRepository {
  private readonly studentStore = inject(StudentMockStore);
  private readonly professorStore = inject(ProfessorMockStore);

  changePassword(
    userId: number,
    request: ChangePasswordRequest,
    selfChange: boolean,
  ): Observable<void> {
    return mockChangePassword(
      this.studentStore,
      this.professorStore,
      userId,
      request.currentPassword,
      selfChange,
    );
  }
}
