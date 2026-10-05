import { termYear } from './term.util';

describe('termYear', () => {
  it('reads the calendar year of a term', () => {
    expect(termYear('26O')).toBe(2026);
    expect(termYear('27i')).toBe(2027);
    expect(termYear(' 26P ')).toBe(2026);
  });

  it('returns null for anything that is not a term', () => {
    expect(termYear(null)).toBeNull();
    expect(termYear('')).toBeNull();
    expect(termYear('2026')).toBeNull();
    expect(termYear('26X')).toBeNull();
  });
});
