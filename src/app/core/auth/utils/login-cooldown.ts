import { DestroyRef, signal, WritableSignal } from '@angular/core';

export interface LoginCooldown {
  readonly remainingSeconds: WritableSignal<number>;
  recordFailedAttempt(): void;
  clear(): void;
  isActive(): boolean;
}

export function createLoginCooldown(
  destroyRef: DestroyRef,
  options: { maxAttempts?: number; cooldownMs?: number } = {},
): LoginCooldown {
  const maxAttempts = options.maxAttempts ?? 3;
  const cooldownMs = options.cooldownMs ?? 30_000;
  const remainingSeconds = signal(0);
  let failedAttempts = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  const clear = (): void => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    failedAttempts = 0;
    remainingSeconds.set(0);
  };

  const start = (): void => {
    remainingSeconds.set(Math.ceil(cooldownMs / 1000));
    timer = setInterval(() => {
      const remaining = remainingSeconds() - 1;
      remainingSeconds.set(remaining);
      if (remaining <= 0) {
        clear();
      }
    }, 1000);
  };

  destroyRef.onDestroy(() => clear());

  return {
    remainingSeconds,
    recordFailedAttempt(): void {
      failedAttempts++;
      if (failedAttempts >= maxAttempts) {
        start();
      }
    },
    clear,
    isActive(): boolean {
      return remainingSeconds() > 0;
    },
  };
}
