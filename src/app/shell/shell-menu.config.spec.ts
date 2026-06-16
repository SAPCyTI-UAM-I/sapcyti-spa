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

  it('does not expose the removed enrollment landing in the student menu', () => {
    const nav = getShellNavigation('STUDENT');
    const routes = nav?.sections.flatMap((section) => section.items.map((item) => item.route));
    expect(routes ?? []).not.toContain('/enrollment');
  });

  it('returns professor advisor approval route', () => {
    const nav = getShellNavigation('PROFESSOR');
    expect(nav?.sections[0]?.items[0]?.route).toBe('/enrollment/advisor-approval');
  });

  it('does not expose the change-password link in the sidebar navigation', () => {
    const routes = getShellNavigation('COORDINATOR')?.sections.flatMap((section) =>
      section.items.map((item) => item.route),
    );
    expect(routes).not.toContain('/account/password');
  });
});
