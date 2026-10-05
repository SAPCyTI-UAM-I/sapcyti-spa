import { describe, expect, it } from 'vitest';

import { APP_VERSION } from './app-version';

describe('APP_VERSION', () => {
  it('reads semantic version from package.json', () => {
    expect(APP_VERSION).toBeDefined();
    expect(typeof APP_VERSION).toBe('string');
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
