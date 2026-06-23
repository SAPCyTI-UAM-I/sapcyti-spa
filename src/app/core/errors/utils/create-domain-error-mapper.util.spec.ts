import { HttpErrorResponse } from '@angular/common/http';

import { mockApiError, mockSpringBootNotFound } from '../testing/mock-api-error.util';
import {
  createDomainErrorMapper,
  matchCode,
  matchSpringBootNotFound,
} from './create-domain-error-mapper.util';

describe('createDomainErrorMapper', () => {
  const mapTestError = createDomainErrorMapper({
    rules: [
      { match: matchCode('KNOWN'), key: 'known' },
      { match: matchSpringBootNotFound, key: 'missing_route' },
    ],
    fallback: 'server',
    securityFallback: 'opaque',
  });

  it('returns the first matching rule', () => {
    const error = mockApiError({ status: 400, error: 'KNOWN' });
    expect(mapTestError(error)).toBe('known');
  });

  it('maps Spring Boot 404 without message', () => {
    expect(mapTestError(mockSpringBootNotFound())).toBe('missing_route');
  });

  it('returns securityFallback for forbidden responses', () => {
    const error = mockApiError({
      status: 403,
      error: 'FORBIDDEN',
      message: 'You can only change your own password',
    });
    expect(mapTestError(error)).toBe('opaque');
  });

  it('returns fallback when the body cannot be parsed', () => {
    expect(mapTestError(new HttpErrorResponse({ status: 0 }))).toBe('server');
  });
});
