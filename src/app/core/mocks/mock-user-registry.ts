import { InjectionToken } from '@angular/core';

/** Minimal contract for mock stores that track catalog users by userId. */
export interface MockUserRegistry {
  hasUser(userId: number): boolean;
}

export const MOCK_STUDENT_USER_REGISTRY = new InjectionToken<MockUserRegistry>(
  'MOCK_STUDENT_USER_REGISTRY',
);

export const MOCK_PROFESSOR_USER_REGISTRY = new InjectionToken<MockUserRegistry>(
  'MOCK_PROFESSOR_USER_REGISTRY',
);
