import type { AcademicTerm } from './enrollment-survey.model';

export type TrimestralPlanStatus = 'BORRADOR' | 'TERMINADA';

export type ScheduleDay = 'LUN' | 'MAR' | 'MIE' | 'JUE' | 'VIE';

export const SCHEDULE_DAYS: readonly ScheduleDay[] = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE'];

export interface DaySchedule {
  day: ScheduleDay;
  /** `HH:mm` (24h) or null. */
  start: string | null;
  end: string | null;
  /** true → the salón column exports `LAB`; the coordinator never assigns a real room. */
  lab: boolean;
}

/** Stable warning codes; never block a write, always returned in `warnings[]`. */
export type PlanWarningCode =
  | 'NO_RESPONSES'
  | 'UEA_DEACTIVATED'
  | 'STUDENT_INACTIVE'
  | 'PROFESSOR_INACTIVE'
  | 'CUPO_EXCEEDED';

export interface PlanWarning {
  code: PlanWarningCode;
  clave?: string;
  enrollmentId?: string;
  employeeNumber?: string;
  groupId?: number;
}

export interface GroupStudent {
  studentId: number;
  enrollmentId: string;
  fullName: string;
  /** MANUAL = added by hand, did not answer the survey. */
  source: 'SURVEY' | 'MANUAL';
  academicTerm: AcademicTerm | null;
  /** Per-student note, exported next to the matrícula (col AB), e.g. "Maestría Física". */
  obs: string | null;
}

export interface BlankStudent {
  studentId: number;
  enrollmentId: string;
  fullName: string;
  academicTerm: AcademicTerm;
}

export type UnassignedDemandReason =
  | 'UEA_NOT_OFFERED'
  | 'GROUP_LIMIT_REACHED'
  | 'GROUP_SUFFIX_LIMIT'
  | 'MANUALLY_UNASSIGNED';

/** One UEA selection that could not be placed in a group. It is never exported. */
export interface UnassignedDemand {
  studentId: number;
  enrollmentId: string;
  fullName: string;
  academicTerm: AcademicTerm | null;
  ueaId: number;
  clave: string;
  nombre: string;
  reason: UnassignedDemandReason;
}

export type TrimestralPlanOutdatedReason = 'SURVEY_REOPENED' | 'ANNUAL_PLAN_CHANGED';

export interface TrimestralPlanPrerequisites {
  surveyClosed: boolean;
  annualPlanTerminated: boolean;
}

/** A professor assigned to a group; research groups can have several (co-directors). */
export interface GroupProfessor {
  professorId: number;
  /** Snapshots — read-only, never sent back on save. */
  employeeNumber: string | null;
  professorName: string;
}

export interface TrimestralGroup {
  id: number;
  ueaId: number;
  /** Catalog snapshots — read-only, never sent back on save. */
  clave: string;
  nombre: string;
  tipoUea: string;
  /** Proposed group letter (e.g. `CO43`); null = unassigned. */
  grupo: string | null;
  /** Number or `*`; null when the annual plan did not define it. */
  cupo: string | null;
  /** Maximum groups from the annual plan; `*` means flexible. */
  maxGroups: string | null;
  /** Zero or more professors (co-directors); order is the capture order. */
  professors: GroupProfessor[];
  /** Always 5 entries, LUN..VIE in order. */
  schedule: DaySchedule[];
  students: GroupStudent[];
}

export interface TrimestralPlanSummary {
  id: number;
  term: string;
  status: TrimestralPlanStatus;
  surveyId: number;
  /** Compatibility projection of the persisted outdated reasons. */
  outdated: boolean;
  /** ISO-8601 instant of the latest Excel export; null until the plan is exported. */
  exportedAt: string | null;
  groupCount: number;
  blankCount: number;
}

export interface TrimestralPlanDetail {
  id: number;
  term: string;
  status: TrimestralPlanStatus;
  surveyId: number;
  /** Compatibility projection of `outdatedReasons.length > 0`. */
  outdated: boolean;
  outdatedReasons: TrimestralPlanOutdatedReason[];
  prerequisites: TrimestralPlanPrerequisites;
  /** ISO-8601 instant of the latest Excel export; null until the plan is exported. */
  exportedAt: string | null;
  groups: TrimestralGroup[];
  /** No group and no letter; excluded from the Excel export. */
  blankStudents: BlankStudent[];
  /** Demand that could not be placed; excluded from the Excel export. */
  unassignedDemand: UnassignedDemand[];
  /** Never null; `[]` when there are no warnings. */
  warnings: PlanWarning[];
}

export interface CreateTrimestralPlanRequest {
  surveyId: number;
}

export interface SaveGroupStudentRequest {
  studentId: number;
  obs: string | null;
}

export interface SaveGroupRequest {
  /** null = new group. */
  id: number | null;
  ueaId: number;
  grupo: string | null;
  cupo: string | null;
  professorIds: number[];
  schedule: DaySchedule[];
  students: SaveGroupStudentRequest[];
}

/** HU-59: replaces the full set of groups. */
export interface SaveTrimestralPlanRequest {
  groups: SaveGroupRequest[];
}

export interface ChangeTrimestralPlanStatusRequest {
  status: TrimestralPlanStatus;
}
