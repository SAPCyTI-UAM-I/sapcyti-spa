/** Term format: two year digits + period letter, e.g. `26O`, `27I`, `27P`. */
export const TERM_PATTERN = /^\d{2}[OIP]$/i;

/**
 * Calendar year of a term (`26O` → 2026), used to link a term to the annual plan
 * that governs it. Returns null for anything that is not a well-formed term.
 */
export function termYear(term: string | null | undefined): number | null {
  const trimmed = term?.trim() ?? '';
  if (!TERM_PATTERN.test(trimmed)) return null;
  return 2000 + Number(trimmed.slice(0, 2));
}
