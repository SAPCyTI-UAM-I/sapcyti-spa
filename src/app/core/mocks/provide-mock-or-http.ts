import { inject, InjectionToken, Provider, Type } from '@angular/core';

import { injectMockEnabled, MockFeature } from './mock.config';

export function provideMockOrHttpRepository<T>(
  feature: MockFeature,
  token: InjectionToken<T>,
  httpClass: Type<T>,
  mockClass: Type<T>,
): Provider[] {
  return [
    httpClass,
    mockClass,
    {
      provide: token,
      useFactory: (): T => (injectMockEnabled(feature) ? inject(mockClass) : inject(httpClass)),
    },
  ];
}
