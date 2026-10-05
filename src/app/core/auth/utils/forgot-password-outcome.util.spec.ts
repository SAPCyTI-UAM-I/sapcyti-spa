import { HttpErrorResponse } from '@angular/common/http';

import { resolveForgotPasswordOutcome } from './forgot-password-outcome.util';

describe('resolveForgotPasswordOutcome', () => {
  it('navigates to sent screen for 4xx responses', () => {
    const error = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });

    expect(resolveForgotPasswordOutcome(error)).toBe('navigate_sent');
  });

  it('shows server error for 5xx responses', () => {
    const error = new HttpErrorResponse({ status: 503, statusText: 'Service Unavailable' });

    expect(resolveForgotPasswordOutcome(error)).toBe('show_server_error');
  });

  it('shows server error when status is missing', () => {
    expect(resolveForgotPasswordOutcome(new Error('network failure'))).toBe('show_server_error');
  });
});
