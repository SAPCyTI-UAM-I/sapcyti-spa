/**
 * Single source of truth for the SAPCyTI design palette.
 *
 * Consumed by:
 *  - `sapcyti-preset.ts`  → PrimeNG semantic tokens
 *  - `styles.css`         → Tailwind @theme `--color-brand-*` variables
 *  - `catalog-tag.util.ts` → `CATALOG_TAG_SEVERITY` → PrimeNG `p-tag` severities
 *
 * When adding or changing a colour, update it HERE first and keep the
 * Tailwind @theme block in `styles.css` in sync.
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

export const SECONDARY = {
  50: '#F0FDFA',
  100: '#CCFBF1',
  200: '#99F6E4',
  300: '#5EEAD4',
  400: '#2DD4BF',
  500: '#0F766E',
  600: '#0D5F59',
  700: '#0F504A',
  800: '#134E4A',
  900: '#042F2E',
  950: '#00201D',
} as const;

/** Accent used only for the doctorado program-type badge. */
export const ACCENT_PURPLE = {
  100: '#E9D5FF',
  700: '#6B21A8',
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
  errorStrong: '#991B1B',
  errorContainer: '#FEF2F2',
  errorBorder: '#FECACA',
  onErrorContainer: '#991B1B',
  success: '#2D6A4F',
  successStrong: '#1B4332',
  successContainer: '#E8F5E9',
  successBorder: '#A7D7B5',
  warning: '#B45309',
  warningStrong: '#92400E',
  warningContainer: '#FFF7ED',
  warningBorder: '#FDBA74',
  info: '#2563EB',
  infoStrong: '#1D4ED8',
  infoContainer: '#EFF6FF',
  infoBorder: '#BFDBFE',
  accent: '#4F46E5',
  accentContainer: '#EEF2FF',
  accentMuted: '#818CF8',
} as const;

/**
 * PrimeNG `p-tag` severity keys for catalog badges.
 * Colors resolve through `sapcyti-preset` → `tag.colorScheme` (SEMANTIC palette above).
 * Map domain values with helpers in `features/academic-catalog/utils/catalog-tag.util.ts`.
 */
export type CatalogTagSeverity =
  | 'success'
  | 'info'
  | 'warn'
  | 'secondary'
  | 'maestria'
  | 'doctorado';

/** Tag colors for program-type badges (`CatalogTagComponent` applies these inline). */
export const CATALOG_PROGRAM_TYPE_TAG = {
  maestria: {
    background: SECONDARY[100],
    color: SECONDARY[700],
  },
  doctorado: {
    background: ACCENT_PURPLE[100],
    color: ACCENT_PURPLE[700],
  },
} as const;

export const CATALOG_TAG_SEVERITY = {
  programType: {
    MAESTRIA: 'maestria',
    DOCTORADO: 'doctorado',
  },
  studentAccountStatus: {
    active: 'success',
    inactive: 'secondary',
  },
  programStatus: {
    ACTIVO: 'success',
    BAJA: 'warn',
    EGRESADO: 'info',
  },
} as const satisfies {
  programType: Record<'MAESTRIA' | 'DOCTORADO', CatalogTagSeverity>;
  studentAccountStatus: Record<'active' | 'inactive', CatalogTagSeverity>;
  programStatus: Record<'ACTIVO' | 'BAJA' | 'EGRESADO', CatalogTagSeverity>;
};
