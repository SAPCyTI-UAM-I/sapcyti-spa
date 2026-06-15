import { UserMenuItem } from '../shared/components';

/**
 * Actions shown in the top-bar user menu, in display order.
 * Available to every authenticated role; add new entries here to extend it.
 */
export const USER_MENU_ITEMS: readonly UserMenuItem[] = [
  {
    id: 'change-password',
    labelKey: 'SHELL.MENU.CHANGE_PASSWORD',
    icon: 'pi pi-key',
    route: '/account/password',
  },
];
