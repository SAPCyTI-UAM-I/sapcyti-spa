import { BACKEND_MESSAGES } from '../../../core/errors/constants/backend-messages';
import {
  createDomainErrorMapper,
  matchCode,
  matchNotFound,
  matchStatus,
  matchValidation,
} from '../../../core/errors/utils/create-domain-error-mapper.util';

export const PASSWORD_CHANGE_ERROR_I18N_SCOPE = 'ACCOUNT.PASSWORD.ERRORS' as const;

export type PasswordChangeError = 'current_password' | 'user_not_found' | 'server';

export const mapPasswordChangeError = createDomainErrorMapper<PasswordChangeError>({
  rules: [
    { match: matchCode('CURRENT_PASSWORD_INCORRECT'), key: 'current_password' },
    {
      match: matchValidation(BACKEND_MESSAGES.IDENTITY.CURRENT_PASSWORD_INCORRECT),
      key: 'current_password',
    },
    { match: matchNotFound(BACKEND_MESSAGES.IDENTITY.USER_NOT_FOUND), key: 'user_not_found' },
    { match: matchCode('USER_NOT_FOUND'), key: 'user_not_found' },
    { match: matchStatus(404), key: 'user_not_found' },
  ],
  fallback: 'server',
  securityFallback: 'server',
});
