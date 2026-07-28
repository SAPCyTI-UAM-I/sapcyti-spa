import { isQuotaValue, QUOTA_PATTERN } from './quota.util';

describe('quota utilities', () => {
  it('accepts wildcard, positive integers and absent values', () => {
    expect(isQuotaValue(null)).toBe(true);
    expect(isQuotaValue('')).toBe(true);
    expect(isQuotaValue('*')).toBe(true);
    expect(isQuotaValue('15')).toBe(true);
  });

  it('rejects zero, leading zeroes and invalid formats', () => {
    expect(isQuotaValue('0')).toBe(false);
    expect(isQuotaValue('012')).toBe(false);
    expect(isQuotaValue('-1')).toBe(false);
    expect(isQuotaValue('1.5')).toBe(false);
    expect(QUOTA_PATTERN.test('abc')).toBe(false);
  });
});
