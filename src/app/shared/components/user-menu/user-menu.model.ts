/** A single actionable entry inside the top-bar user menu. */
export interface UserMenuItem {
  /** Stable identifier, used for tracking and testing. */
  id: string;
  /** i18n key resolved to the visible label. */
  labelKey: string;
  /** PrimeIcons class, e.g. `pi pi-key`. */
  icon: string;
  /** Absolute route navigated to when the item is selected. */
  route: string;
}
