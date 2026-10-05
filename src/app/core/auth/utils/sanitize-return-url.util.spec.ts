import { sanitizeReturnUrl } from './sanitize-return-url.util';

describe('sanitizeReturnUrl', () => {
  it('returns dashboard for empty or external urls', () => {
    expect(sanitizeReturnUrl(undefined)).toBe('/dashboard');
    expect(sanitizeReturnUrl('')).toBe('/dashboard');
    expect(sanitizeReturnUrl('//evil.com')).toBe('/dashboard');
    expect(sanitizeReturnUrl('https://evil.com')).toBe('/dashboard');
  });

  it('allows internal paths', () => {
    expect(sanitizeReturnUrl('/enrollment')).toBe('/enrollment');
  });
});
