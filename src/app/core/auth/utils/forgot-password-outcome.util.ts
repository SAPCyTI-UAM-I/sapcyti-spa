import { getHttpStatus } from '../../http/utils/parse-api-error.util';

export type ForgotPasswordOutcome = 'navigate_sent' | 'show_server_error';

/**
 * HU-02 anti-enumeration: 4xx responses behave like success (navigate to sent screen).
 * Only 5xx or network failures surface a server error.
 */
export function resolveForgotPasswordOutcome(error: unknown): ForgotPasswordOutcome {
  const status = getHttpStatus(error);

  if (status !== undefined && status < 500) {
    return 'navigate_sent';
  }

  return 'show_server_error';
}
