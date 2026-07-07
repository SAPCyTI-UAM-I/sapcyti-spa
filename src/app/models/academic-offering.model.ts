/**
 * Skeleton domain types for the Academic Offering feature (HU-05, HU-06).
 *
 * These are placeholders for the eventual contract with `sapcyti-api`
 * (academic-offering bounded context). Shapes are intentionally minimal and
 * will be refined when the data layer (repository + HTTP) is implemented.
 *
 * The annual-plan types (HU-49–53) live in `models/annual-plan.model.ts`.
 */

/** A subject row shown while editing a quarterly plan, one per group (HU-05). */
export interface QuarterlyPlanSubject {
  id: number;
  /** Catalog key, e.g. "1151001". */
  key: string;
  name: string;
  /** Group code, e.g. "CO33", "CO33A". */
  group: string;
  capacity: number;
  professorName?: string;
  employeeNumber?: string;
  isResearchProject?: boolean;
}

/** Weekday selectable for a subject schedule (HU-05). */
export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';

/** Selectable option (term/subject/professor/student) for the offering selectors. */
export interface AcademicOfferingOption {
  value: string;
  label: string;
}
