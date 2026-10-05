import { HttpErrorResponse } from '@angular/common/http';

import { BACKEND_MESSAGES } from '../../../core/errors/constants/backend-messages';
import { mapPasswordChangeError } from './password-change-error.util';

describe('mapPasswordChangeError', () => {
  it('maps legacy mock current-password code', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { error: 'CURRENT_PASSWORD_INCORRECT' },
    });

    expect(mapPasswordChangeError(error)).toBe('current_password');
  });

  it('maps production validation message for wrong current password', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        error: 'VALIDATION_ERROR',
        message: BACKEND_MESSAGES.IDENTITY.CURRENT_PASSWORD_INCORRECT,
      },
    });

    expect(mapPasswordChangeError(error)).toBe('current_password');
  });

  it('maps user not found responses', () => {
    const error = new HttpErrorResponse({
      status: 404,
      error: { error: 'NOT_FOUND', message: BACKEND_MESSAGES.IDENTITY.USER_NOT_FOUND },
    });

    expect(mapPasswordChangeError(error)).toBe('user_not_found');
  });

  it('returns opaque server error for forbidden password changes', () => {
    const error = new HttpErrorResponse({
      status: 403,
      error: { error: 'FORBIDDEN', message: 'You can only change your own password' },
    });

    expect(mapPasswordChangeError(error)).toBe('server');
  });
});
