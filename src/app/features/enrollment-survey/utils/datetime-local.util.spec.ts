import { isoToLocal, localToIso } from './datetime-local.util';

describe('datetime-local.util', () => {
  it('returns empty string for empty input', () => {
    expect(localToIso('')).toBe('');
    expect(isoToLocal('')).toBe('');
    expect(isoToLocal(null)).toBe('');
  });

  it('round-trips a local datetime through ISO without losing the minute', () => {
    const local = '2026-10-01T08:30';
    const iso = localToIso(local);
    expect(iso).not.toBe('');
    expect(isoToLocal(iso)).toBe(local);
  });

  it('produces a valid ISO instant', () => {
    expect(localToIso('2026-10-01T08:30')).toBe(new Date('2026-10-01T08:30').toISOString());
  });

  it('returns empty string for invalid values', () => {
    expect(localToIso('not-a-date')).toBe('');
    expect(isoToLocal('not-a-date')).toBe('');
  });
});
