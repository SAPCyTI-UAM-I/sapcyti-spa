import { mockApiError } from './mock-api-error.util';

describe('mockApiError', () => {
  it('keeps legacy callers without details', () => {
    const error = mockApiError({
      status: 400,
      error: 'VALIDATION_ERROR',
      message: 'Invalid exam type',
    });

    expect(error.status).toBe(400);
    expect(error.error).toEqual({
      error: 'VALIDATION_ERROR',
      message: 'Invalid exam type',
    });
  });

  it('includes optional details when provided', () => {
    const details = { currentVersion: 3 };
    const error = mockApiError({
      status: 409,
      error: 'VERSION_CONFLICT',
      message: 'The resource version changed',
      details,
    });

    expect(error.error).toEqual({
      error: 'VERSION_CONFLICT',
      message: 'The resource version changed',
      details,
    });
  });

  it('still builds a body when only details is added to status and code', () => {
    const error = mockApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      details: { fieldErrors: [] },
    });

    expect(error.error).toEqual({
      error: 'VALIDATION_ERROR',
      details: { fieldErrors: [] },
    });
  });
});
