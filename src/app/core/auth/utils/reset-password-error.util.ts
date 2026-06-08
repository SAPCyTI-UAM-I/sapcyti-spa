import { getApiErrorCode, getHttpStatus } from '../../http/utils/parse-api-error.util';

export type ResetErrorType = 'server' | 'invalid_token' | 'expired_token';

export function mapResetPasswordError(error: unknown): ResetErrorType {
  const code = getApiErrorCode(error);
  const status = getHttpStatus(error);

  if (code === 'EXPIRED_TOKEN') {
    return 'expired_token';
  }

  if (status === 400 && (code === 'INVALID_TOKEN' || code === 'TOKEN_USED')) {
    return 'invalid_token';
  }

  return 'server';
}
