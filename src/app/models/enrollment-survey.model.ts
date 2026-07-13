export type SurveyStatus = 'PROGRAMADO' | 'ACTIVO' | 'CERRADO';
export type SurveyMode = 'ENROLL_UEAS' | 'BLANK';

export type AcademicTerm =
  | 'I'
  | 'II'
  | 'III'
  | 'IV'
  | 'V'
  | 'VI'
  | 'VII'
  | 'VIII'
  | 'IX'
  | 'X'
  | 'XI'
  | 'XII';

export const ACADEMIC_TERMS: readonly AcademicTerm[] = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
];

export interface SurveyResponse {
  id: number;
  term: string;
  status: SurveyStatus;
  opensAt: string;
  closesAt: string;
  introMessage: string | null;
  responseCount: number;
  /** Only populated on the "new survey" screen; null when there is no previous survey. */
  suggestedTerm: string | null;
}

export interface CreateSurveyRequest {
  term: string;
  opensAt: string;
  closesAt: string;
  introMessage?: string | null;
}

/** Same shape as create; also used to reopen a CERRADO survey with new future dates. */
export type UpdateSurveyRequest = CreateSurveyRequest;

export interface SurveyStudentInfo {
  fullName: string;
  enrollmentId: string;
  programType: 'MAESTRIA' | 'DOCTORADO';
}

export interface SurveyAvailableUea {
  id: number;
  clave: string;
  nombre: string;
  creditos: number;
}

export interface SubmittedResponse {
  academicTerm: string;
  mode: SurveyMode;
  ueaIds: number[];
  totalUeas: number;
  submittedAt: string;
}

/** Response of GET /enrollment-surveys/active. */
export interface StudentSurveyForm {
  survey: SurveyResponse;
  student: SurveyStudentInfo;
  availableUeas: SurveyAvailableUea[];
  /** UEA claves removed from the catalog after the survey opened; empty array, never null. */
  removedUeaClaves: string[];
  myResponse: SubmittedResponse | null;
}

export interface SubmitResponseRequest {
  academicTerm: AcademicTerm;
  mode: SurveyMode;
  ueaIds: number[];
}

export interface SurveyResultsSummary {
  eligibleCount: number;
  respondedCount: number;
  pendingCount: number;
}

export interface UeaDemandRow {
  ueaId: number;
  clave: string;
  nombre: string;
  tipoFormacion: string;
  creditos: number;
  totalResponses: number;
}

export interface InterestedStudent {
  fullName: string;
  enrollmentId: string;
}
