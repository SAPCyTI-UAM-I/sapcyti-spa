import { combineToDate, combineToIso, isoToDate, isoToTime } from './datetime-fields.util';

describe('datetime-fields.util', () => {
  it('returns null/empty when a field is missing', () => {
    expect(combineToDate('2026-10-01', '')).toBeNull();
    expect(combineToDate('', '08:30')).toBeNull();
    expect(combineToIso('2026-10-01', '')).toBe('');
    expect(isoToDate('')).toBe('');
    expect(isoToTime(null)).toBe('');
  });

  it('round-trips date + time through ISO', () => {
    const iso = combineToIso('2026-10-01', '08:30');
    expect(iso).not.toBe('');
    expect(isoToDate(iso)).toBe('2026-10-01');
    expect(isoToTime(iso)).toBe('08:30');
  });

  it('produces a valid ISO instant', () => {
    expect(combineToIso('2026-10-01', '08:30')).toBe(new Date('2026-10-01T08:30').toISOString());
  });
});
