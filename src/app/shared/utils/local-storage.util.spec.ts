import { readStoredBoolean, writeStoredBoolean } from './local-storage.util';

describe('local-storage.util', () => {
  const KEY = 'test.flag';

  afterEach(() => localStorage.clear());

  it('round-trips a true value', () => {
    writeStoredBoolean(KEY, true);
    expect(readStoredBoolean(KEY)).toBe(true);
  });

  it('round-trips a false value', () => {
    writeStoredBoolean(KEY, false);
    expect(readStoredBoolean(KEY)).toBe(false);
  });

  it('returns false for a missing key', () => {
    expect(readStoredBoolean('missing.key')).toBe(false);
  });
});
