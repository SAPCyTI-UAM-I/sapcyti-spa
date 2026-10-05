import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { createLoginCooldown } from './login-cooldown';

function createTestDestroyRef(): DestroyRef {
  return {
    onDestroy: () => () => undefined,
    destroyed: false,
  } as unknown as DestroyRef;
}

describe('createLoginCooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts cooldown after reaching max failed attempts', () => {
    const cooldown = TestBed.runInInjectionContext(() =>
      createLoginCooldown(createTestDestroyRef(), { maxAttempts: 3, cooldownMs: 30_000 }),
    );

    cooldown.recordFailedAttempt();
    cooldown.recordFailedAttempt();
    expect(cooldown.isActive()).toBe(false);

    cooldown.recordFailedAttempt();
    expect(cooldown.isActive()).toBe(true);
    expect(cooldown.remainingSeconds()).toBe(30);
  });

  it('counts down and clears when finished', () => {
    const cooldown = TestBed.runInInjectionContext(() =>
      createLoginCooldown(createTestDestroyRef(), { maxAttempts: 1, cooldownMs: 3_000 }),
    );

    cooldown.recordFailedAttempt();
    expect(cooldown.remainingSeconds()).toBe(3);

    vi.advanceTimersByTime(1_000);
    expect(cooldown.remainingSeconds()).toBe(2);

    vi.advanceTimersByTime(2_000);
    expect(cooldown.isActive()).toBe(false);
    expect(cooldown.remainingSeconds()).toBe(0);
  });

  it('clears failed attempts and timer on clear', () => {
    const cooldown = TestBed.runInInjectionContext(() =>
      createLoginCooldown(createTestDestroyRef(), { maxAttempts: 2, cooldownMs: 10_000 }),
    );

    cooldown.recordFailedAttempt();
    cooldown.recordFailedAttempt();
    expect(cooldown.isActive()).toBe(true);

    cooldown.clear();
    expect(cooldown.isActive()).toBe(false);

    cooldown.recordFailedAttempt();
    expect(cooldown.isActive()).toBe(false);
  });
});
