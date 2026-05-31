import { getShellNavigation, resolveShellMenuRole } from './shell-menu.config';

describe('shell-menu.config', () => {
  it('returns presentations navigation for SYSTEM_ADMIN', () => {
    expect(resolveShellMenuRole('SYSTEM_ADMIN')).toBe('SYSTEM_ADMIN');
    expect(getShellNavigation('SYSTEM_ADMIN')?.sections[0]?.items[0]?.route).toBe('/presentations');
  });

  it('returns presentations navigation for SPEAKER', () => {
    expect(resolveShellMenuRole('SPEAKER')).toBe('SPEAKER');
    expect(getShellNavigation('SPEAKER')?.sections[0]?.items[0]?.route).toBe('/presentations');
  });

  it('returns student menu with enrollment link', () => {
    const nav = getShellNavigation('STUDENT');
    expect(nav?.sections[0]?.items[0]?.route).toBe('/enrollment');
  });

  it('returns professor advisor approval route', () => {
    const nav = getShellNavigation('PROFESSOR');
    expect(nav?.sections[0]?.items[0]?.route).toBe('/enrollment/advisor-approval');
  });
});
