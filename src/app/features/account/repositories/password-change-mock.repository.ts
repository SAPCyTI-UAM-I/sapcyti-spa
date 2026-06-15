import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AcademicCatalogMockStore } from '../../academic-catalog/mocks/academic-catalog-mock.store';
import { mockChangePassword } from '../mocks/password-change.mock';
import { ChangePasswordRequest, PasswordChangeRepository } from './password-change.repository';

@Injectable()
export class PasswordChangeMockRepository implements PasswordChangeRepository {
  private readonly mockStore = inject(AcademicCatalogMockStore);

  changePassword(
    userId: number,
    request: ChangePasswordRequest,
    selfChange: boolean,
  ): Observable<void> {
    return mockChangePassword(this.mockStore, userId, request.currentPassword, selfChange);
  }
}
