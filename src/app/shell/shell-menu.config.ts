export interface ShellMenuItem {
  labelKey: string;
  route: string;
  icon: string;
}

export const SHELL_MENU_ITEMS: readonly ShellMenuItem[] = [
  { labelKey: 'SHELL.MENU.DASHBOARD', route: '/dashboard', icon: 'pi pi-home' },
  { labelKey: 'SHELL.MENU.ENROLLMENT', route: '/enrollment', icon: 'pi pi-book' },
  { labelKey: 'SHELL.MENU.CATALOG', route: '/academic-catalog', icon: 'pi pi-users' },
] as const;
