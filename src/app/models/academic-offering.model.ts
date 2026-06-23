/**
 * Skeleton domain types for the Academic Offering feature (HU-04, HU-05, HU-06).
 *
 * These are placeholders for the eventual contract with `sapcyti-api`
 * (academic-offering bounded context). Shapes are intentionally minimal and
 * will be refined when the data layer (repository + HTTP) is implemented.
 */

export type AcademicTermStatus = 'PRELIMINARY' | 'EDITED' | 'IN_ENROLLMENT';

/** Enabled subject within a trimester plan (HU-04): which UEA opens, groups, capacity. */
export interface AnnualPlanEnabledSubject {
  key: string;
  name: string;
  groups: number;
  capacity: number;
}

/** A trimester slot within an annual plan, with its activated UEAs (HU-04). */
export interface AnnualPlanTerm {
  id: number;
  /** Display label, e.g. "16I". */
  code: string;
  status: AcademicTermStatus;
  enabledSubjects: AnnualPlanEnabledSubject[];
}

/** Summary row for an annual plan (HU-04). */
export interface AnnualPlanSummary {
  id: number;
  /** Plan year, e.g. "2026". */
  year: string;
  status: AcademicTermStatus;
}

/** An annual plan with its trimesters (HU-04). */
export interface AnnualPlanDetail extends AnnualPlanSummary {
  terms: AnnualPlanTerm[];
}

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

/** A subject available to be opened while editing a preliminary term (HU-04). */
export interface AvailableAnnualSubject {
  id: number;
  /** Catalog key, e.g. "1151001". */
  key: string;
  name: string;
}

/** Weekday selectable for a subject schedule (HU-05). */
export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';

/** Selectable option (term/subject/professor/student) for the offering selectors. */
export interface AcademicOfferingOption {
  value: string;
  label: string;
}
