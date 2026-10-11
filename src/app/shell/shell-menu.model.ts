import { RoleType } from '../models';

export interface ShellNavLink {
  id: string;
  labelKey: string;
  route: string;
  icon: string;
  /** Si es true, el ítem se muestra pero no navega. */
  disabled?: boolean;
  /** Clave i18n del motivo cuando el ítem está deshabilitado. */
  disabledReasonKey?: string;
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
