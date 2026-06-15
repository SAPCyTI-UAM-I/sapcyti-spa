import { RoleType } from '../models';

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

export type ShellMenuRole = RoleType;
