import { getShellNavigation, resolveShellMenuRole } from './shell-menu.config';

describe('shell-menu.config', () => {
  it('does not expose presentations navigation for SYSTEM_ADMIN', () => {
    expect(resolveShellMenuRole('SYSTEM_ADMIN')).toBe('SYSTEM_ADMIN');
    expect(getShellNavigation('SYSTEM_ADMIN')?.sections).toEqual([]);
  });

  it('does not expose presentations navigation for SPEAKER', () => {
    expect(resolveShellMenuRole('SPEAKER')).toBe('SPEAKER');
    expect(getShellNavigation('SPEAKER')?.sections).toEqual([]);
  });

  it('does not expose the removed enrollment landing in the student menu', () => {
    const nav = getShellNavigation('STUDENT');
    const routes = nav?.sections.flatMap((section) => section.items.map((item) => item.route));
    expect(routes ?? []).not.toContain('/enrollment');
  });

  it('exposes the static exam-request item for STUDENT', () => {
    const nav = getShellNavigation('STUDENT');
    const item = nav?.sections
      .flatMap((section) => section.items)
      .find((link) => link.id === 'exam-request');

    expect(item).toEqual({
      id: 'exam-request',
      labelKey: 'SHELL.MENU.EXAM_REQUEST',
      route: '/exam-requests',
      icon: 'pi pi-verified',
    });
  });

  it('does not expose exam-request navigation for other roles', () => {
    for (const role of [
      'COORDINATOR',
      'PROFESSOR',
      'ASSISTANT',
      'SPEAKER',
      'SYSTEM_ADMIN',
    ] as const) {
      const routes = getShellNavigation(role)?.sections.flatMap((section) =>
        section.items.map((item) => item.id),
      );
      expect(routes ?? []).not.toContain('exam-request');
    }
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
    expect(routes).not.toContain('/academic-offering/enrollment-start');
  });
});
