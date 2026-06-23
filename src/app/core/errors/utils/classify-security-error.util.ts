import { getApiErrorCode, getHttpStatus } from './parse-api-error.util';

/** Auth and authorization failures — map to opaque UI messages, not business detail. */
export function isSecurityError(error: unknown): boolean {
  const status = getHttpStatus(error);
  if (status === 401 || status === 403) {
    return true;
  }

  const code = getApiErrorCode(error);
  return code === 'UNAUTHORIZED' || code === 'FORBIDDEN';
}
