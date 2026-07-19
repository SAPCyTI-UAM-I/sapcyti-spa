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
  | 'UEA_NO_QUOTA'
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
}

export interface BlankStudent {
  studentId: number;
  enrollmentId: string;
  fullName: string;
  academicTerm: AcademicTerm;
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
  employeeNumber: string | null;
  professorId: number | null;
  professorName: string | null;
  /** Always 5 entries, LUN..VIE in order. */
  schedule: DaySchedule[];
  obs: string | null;
  students: GroupStudent[];
}

export interface TrimestralPlanSummary {
  id: number;
  term: string;
  status: TrimestralPlanStatus;
  surveyId: number;
  /** true when the survey was reopened while the plan was in BORRADOR. */
  outdated: boolean;
  groupCount: number;
  blankCount: number;
}

export interface TrimestralPlanDetail {
  id: number;
  term: string;
  status: TrimestralPlanStatus;
  surveyId: number;
  outdated: boolean;
  groups: TrimestralGroup[];
  /** No group and no letter; excluded from the Excel export. */
  blankStudents: BlankStudent[];
  /** Never null; `[]` when there are no warnings. */
  warnings: PlanWarning[];
}

export interface CreateTrimestralPlanRequest {
  surveyId: number;
}

export interface SaveGroupRequest {
  /** null = new group. */
  id: number | null;
  ueaId: number;
  grupo: string | null;
  cupo: string | null;
  professorId: number | null;
  schedule: DaySchedule[];
  obs: string | null;
  studentIds: number[];
}

/** HU-59: replaces the full set of groups. */
export interface SaveTrimestralPlanRequest {
  groups: SaveGroupRequest[];
}

export interface ChangeTrimestralPlanStatusRequest {
  status: TrimestralPlanStatus;
}
