import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  MOCK_PROFESSOR_USER_REGISTRY,
  MOCK_STUDENT_USER_REGISTRY,
} from '../../../core/mocks/mock-user-registry';
import { mockChangePassword } from '../mocks/password-change.mock';
import { ChangePasswordRequest, PasswordChangeRepository } from './password-change.repository';

@Injectable()
export class PasswordChangeMockRepository implements PasswordChangeRepository {
  private readonly studentRegistry = inject(MOCK_STUDENT_USER_REGISTRY);
  private readonly professorRegistry = inject(MOCK_PROFESSOR_USER_REGISTRY);

  changePassword(
    userId: number,
    request: ChangePasswordRequest,
    selfChange: boolean,
  ): Observable<void> {
    return mockChangePassword(
      this.studentRegistry,
      this.professorRegistry,
      userId,
      request.currentPassword,
      selfChange,
    );
  }
}
