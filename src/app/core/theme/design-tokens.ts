/**
 * Single source of truth for the SAPCyTI design palette.
 *
 * Consumed by:
 *  - `sapcyti-preset.ts`  → PrimeNG semantic tokens
 *  - `styles.css`         → Tailwind @theme `--color-brand-*` variables
 *
 * When adding or changing a colour, update it HERE and both consumers
 * pick it up automatically (PrimeNG via JS import, Tailwind via the
 * duplicated @theme block that must stay in sync — a comment there
 * references this file).
 */

export const PRIMARY = {
  50: '#E8F1F8',
  100: '#D4E6F4',
  200: '#A8CCE8',
  300: '#6FA3D1',
  400: '#3D6F9C',
  500: '#1E4D7B',
  600: '#163A5F',
  700: '#0F2D47',
  800: '#0A2236',
  900: '#051525',
  950: '#020A12',
} as const;

export const SURFACE = {
  0: '#FFFFFF',
  50: '#F7F8FA',
  100: '#F0F4F8',
  200: '#E5E8EB',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#5C6670',
  600: '#42474F',
  700: '#1A1D21',
  800: '#0B1C30',
  900: '#051525',
  950: '#020A12',
} as const;

export const SEMANTIC = {
  error: '#B91C1C',
  errorContainer: '#FEF2F2',
  onErrorContainer: '#991B1B',
  success: '#2D6A4F',
  warning: '#B45309',
  info: '#2563EB',
} as const;
