import { RoleType } from '../models';
import { UserMenuItem } from '../shared/components';

/**
 * Returns actions shown in the top-bar user menu based on the user's role.
 * Students have access to their profile view.
 */
export function getUserMenuItems(role?: RoleType | null): readonly UserMenuItem[] {
  const items: UserMenuItem[] = [];

  if (role === 'STUDENT') {
    items.push({
      id: 'profile',
      labelKey: 'SHELL.MENU.PROFILE',
      icon: 'pi pi-user',
      route: '/account/profile',
    });
  }

  items.push({
    id: 'change-password',
    labelKey: 'SHELL.MENU.CHANGE_PASSWORD',
    icon: 'pi pi-key',
    route: '/account/password',
  });

  return items;
}

/**
 * Default actions shown in the top-bar user menu (for backward compatibility).
 */
export const USER_MENU_ITEMS: readonly UserMenuItem[] = getUserMenuItems();
