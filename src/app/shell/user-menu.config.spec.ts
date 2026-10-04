import { getUserMenuItems } from './user-menu.config';

describe('getUserMenuItems', () => {
  it('returns profile and change-password items for STUDENT role', () => {
    const items = getUserMenuItems('STUDENT');
    expect(items.map((i) => i.id)).toEqual(['profile', 'change-password']);
    expect(items[0]?.route).toBe('/account/profile');
    expect(items[0]?.labelKey).toBe('SHELL.MENU.PROFILE');
  });

  it('returns only change-password for COORDINATOR role', () => {
    const items = getUserMenuItems('COORDINATOR');
    expect(items.map((i) => i.id)).toEqual(['change-password']);
  });

  it('returns only change-password when role is null or undefined', () => {
    expect(getUserMenuItems(null).map((i) => i.id)).toEqual(['change-password']);
    expect(getUserMenuItems(undefined).map((i) => i.id)).toEqual(['change-password']);
  });
});
