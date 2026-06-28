import {
  createDomainErrorMapper,
  matchCode,
} from '../../../core/errors/utils/create-domain-error-mapper.util';

export const RESET_PASSWORD_ERROR_I18N_SCOPE = 'AUTH.RESET_PASSWORD' as const;

export type ResetErrorType = 'server' | 'invalid_token' | 'expired_token';

export const mapResetPasswordError = createDomainErrorMapper<ResetErrorType>({
  rules: [
    { match: matchCode('EXPIRED_TOKEN'), key: 'expired_token' },
    { match: matchCode('INVALID_TOKEN'), key: 'invalid_token' },
    { match: matchCode('TOKEN_USED'), key: 'invalid_token' },
  ],
  fallback: 'server',
  securityFallback: 'server',
});
