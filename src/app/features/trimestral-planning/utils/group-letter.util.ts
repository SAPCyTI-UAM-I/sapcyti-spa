import { AcademicTerm, ACADEMIC_TERMS } from '../../../models';

/**
 * HU-57 — proposed group letter from the student's declared academic term.
 *
 * Letter = 'A' + 13 + n for n in 1..9 (I→O, IX→W); n >= 10 (doctorado 10–12) gets no
 * letter, same as a blank enrollment. The base group is `C{letter}43` (division is always
 * CBI). This is only a *proposal*: the coordinator can overwrite it, which is how
 * "burned" letters (a student who interrupted and returned) get captured.
 */
export function groupLetterForTerm(term: AcademicTerm | null): string | null {
  if (!term) return null;
  const n = ACADEMIC_TERMS.indexOf(term) + 1;
  if (n < 1 || n > 9) return null;
  return String.fromCharCode('A'.charCodeAt(0) + 13 + n);
}

/** Base group for a term, e.g. `I` → `CO43`. Null when the term gets no letter. */
export function baseGroupForTerm(term: AcademicTerm | null): string | null {
  const letter = groupLetterForTerm(term);
  return letter && `C${letter}43`;
}

/**
 * Suffix for repeated UEA + base group when the cupo forces a split (typical of
 * research UEAs with cupo 1): the first keeps `CR43`, the next ones get `A`, `B`, …
 */
export function groupWithSuffix(baseGroup: string, index: number): string {
  if (index <= 0) return baseGroup;
  return `${baseGroup}${String.fromCharCode('A'.charCodeAt(0) + index - 1)}`;
}

/** A missing second last name sorts last, never first (HU-57). */
function compareOptional(a: string | undefined, b: string | undefined): number {
  const left = a?.trim() ?? '';
  const right = b?.trim() ?? '';
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return left.localeCompare(right, 'es');
}

/** Alphabetical order used to decide which student keeps the unsuffixed group. */
export function compareByLastNames(
  a: { firstLastName: string; secondLastName?: string; firstName: string },
  b: { firstLastName: string; secondLastName?: string; firstName: string },
): number {
  return (
    a.firstLastName.localeCompare(b.firstLastName, 'es') ||
    compareOptional(a.secondLastName, b.secondLastName) ||
    a.firstName.localeCompare(b.firstName, 'es')
  );
}
