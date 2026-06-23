import { Provider } from '@angular/core';

import { AuthApiHttpRepository } from '../auth/repositories/auth-api-http.repository';
import { AuthApiMockRepository } from '../auth/repositories/auth-api-mock.repository';
import { AUTH_API_REPOSITORY } from '../auth/repositories/auth-api.repository';
import { PasswordRecoveryHttpRepository } from '../auth/repositories/password-recovery-http.repository';
import { PasswordRecoveryMockRepository } from '../auth/repositories/password-recovery-mock.repository';
import { PASSWORD_RECOVERY_REPOSITORY } from '../auth/repositories/password-recovery.repository';
import {
  MOCK_PROFESSOR_USER_REGISTRY,
  MOCK_STUDENT_USER_REGISTRY,
} from '../mocks/mock-user-registry';
import { provideMockOrHttpRepository } from '../mocks/provide-mock-or-http';
import { PasswordChangeHttpRepository } from '../../features/account/repositories/password-change-http.repository';
import { PasswordChangeMockRepository } from '../../features/account/repositories/password-change-mock.repository';
import { PASSWORD_CHANGE_REPOSITORY } from '../../features/account/repositories/password-change.repository';
import { ProfessorMockStore } from '../../features/academic-catalog/mocks/professor-mock.store';
import { ProfessorHttpRepository } from '../../features/academic-catalog/repositories/professor-http.repository';
import { ProfessorMockRepository } from '../../features/academic-catalog/repositories/professor-mock.repository';
import { PROFESSOR_REPOSITORY } from '../../features/academic-catalog/repositories/professor.repository';
import { StudentMockStore } from '../../features/academic-catalog/mocks/student-mock.store';
import { StudentHttpRepository } from '../../features/academic-catalog/repositories/student-http.repository';
import { StudentMockRepository } from '../../features/academic-catalog/repositories/student-mock.repository';
import { STUDENT_REPOSITORY } from '../../features/academic-catalog/repositories/student.repository';

export const DATA_LAYER_PROVIDERS: Provider[] = [
  { provide: MOCK_STUDENT_USER_REGISTRY, useExisting: StudentMockStore },
  { provide: MOCK_PROFESSOR_USER_REGISTRY, useExisting: ProfessorMockStore },
  ...provideMockOrHttpRepository(
    'students',
    STUDENT_REPOSITORY,
    StudentHttpRepository,
    StudentMockRepository,
  ),
  ...provideMockOrHttpRepository(
    'professors',
    PROFESSOR_REPOSITORY,
    ProfessorHttpRepository,
    ProfessorMockRepository,
  ),
  ...provideMockOrHttpRepository(
    'passwordChange',
    PASSWORD_CHANGE_REPOSITORY,
    PasswordChangeHttpRepository,
    PasswordChangeMockRepository,
  ),
  ...provideMockOrHttpRepository(
    'auth',
    AUTH_API_REPOSITORY,
    AuthApiHttpRepository,
    AuthApiMockRepository,
  ),
  ...provideMockOrHttpRepository(
    'passwordRecovery',
    PASSWORD_RECOVERY_REPOSITORY,
    PasswordRecoveryHttpRepository,
    PasswordRecoveryMockRepository,
  ),
];
