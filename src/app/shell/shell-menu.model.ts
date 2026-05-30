import { RoleType } from '../models/role-type.model';

export interface ShellNavLink {
  id: string;
  labelKey: string;
  route: string;
  icon: string;
}

export interface ShellNavSection {
  id: string;
  labelKey?: string;
  items: readonly ShellNavLink[];
}

export interface ShellNavigation {
  home: ShellNavLink;
  sections: readonly ShellNavSection[];
}

export type ShellMenuRole = Exclude<RoleType, 'SPEAKER' | 'SYSTEM_ADMIN'>;
