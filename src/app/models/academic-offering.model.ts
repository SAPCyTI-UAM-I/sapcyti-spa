/**
 * Skeleton domain types for the Academic Offering feature (HU-05, HU-06).
 *
 * These are placeholders for the eventual contract with `sapcyti-api`
 * (academic-offering bounded context). Shapes are intentionally minimal and
 * will be refined when the data layer (repository + HTTP) is implemented.
 *
 * The annual-plan types (HU-49–53) live in `models/annual-plan.model.ts`.
 */

/** Selectable option (term/subject/professor/student) for the offering selectors. */
export interface AcademicOfferingOption {
  value: string;
  label: string;
}
