import { getShellNavigation, resolveShellMenuRole } from './shell-menu.config';

describe('shell-menu.config', () => {
  it('maps SYSTEM_ADMIN to coordinator navigation', () => {
    expect(resolveShellMenuRole('SYSTEM_ADMIN')).toBe('COORDINATOR');
    expect(getShellNavigation('SYSTEM_ADMIN')?.sections).toHaveLength(2);
  });

  it('returns null navigation for SPEAKER', () => {
    expect(resolveShellMenuRole('SPEAKER')).toBeNull();
    expect(getShellNavigation('SPEAKER')).toBeNull();
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
