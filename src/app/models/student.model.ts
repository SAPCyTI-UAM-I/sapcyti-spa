import type { SurveyMode } from './enrollment-survey.model';
import type { StudentProgramResponse } from './student-program.model';
import type { DaySchedule } from './trimestral-plan.model';

export type ProgramType = 'MAESTRIA' | 'DOCTORADO';

/** HU-18: «último grado de estudios» is a catalog, not free text. */
export type DegreeLevel = 'LICENCIATURA' | 'MAESTRIA' | 'DOCTORADO';

export interface RegisterStudentRequest {
  enrollmentId: string;
  email: string;
  graduateProgramId: number;
  firstName: string;
  firstLastName: string;
  secondLastName?: string;
  nationality: string;
  /** ISO date (YYYY-MM-DD). */
  birthDate: string;
  phone: string;
  phoneExtension?: string;
  undergraduateDegree: string;
  lastDegreeObtained: DegreeLevel;
  programType: ProgramType;
  admissionDate: string;
  /** HU-56: trimestre de ingreso, opcional. Formato `AA[OIP]`, ej. `26O`. */
  admissionTerm?: string;
  lineOfKnowledge?: string;
  researchArea?: string;
  tutorId?: number | null;
  advisorIds?: number[];
}

export interface StudentCatalogItem extends Omit<RegisterStudentRequest, 'admissionTerm'> {
  id: number;
  userId: number;
  active: boolean;
  /** HU-56: opcional; los alumnos cargados antes del campo no lo tienen. */
  admissionTerm: string | null;
}

export interface RegisterStudentResponse extends StudentCatalogItem {
  generatedPassword: string;
}

export interface StudentCatalogQuery {
  page: number;
  size: number;
  search?: string;
  programType?: ProgramType;
  active?: boolean;
}

export interface UpdateStudentRequest {
  firstName: string;
  firstLastName: string;
  secondLastName?: string;
  email: string;
  nationality: string;
  birthDate: string;
  phone: string;
  phoneExtension?: string;
  undergraduateDegree: string;
  lastDegreeObtained: DegreeLevel;
  programType: ProgramType;
  admissionDate: string;
  /**
   * HU-56: opcional en la edición para no obligar a inventar el dato de un alumno
   * histórico al que solo se le corrige otro campo. La api-spec todavía lo declara
   * obligatorio en `PUT /students/{id}`; ver la nota de diseño de 2026-07-19.
   */
  admissionTerm?: string;
  active: boolean;
}

export interface StudentDetailResponse extends StudentCatalogItem {
  /** Programa académico único del alumno. */
  program: StudentProgramResponse;
}

/** HU-61: `PENDING` = todavía no hay planeación TERMINADA de ese trimestre. */
export type EnrollmentHistoryPlanStatus = 'PENDING' | 'TERMINADA';

/** Clave i18n de la nota de la entrada; null cuando no hay nada que aclarar. */
export type EnrollmentHistoryNote = 'PENDING' | 'MANUAL_NOT_SURVEYED';

export interface EnrollmentHistoryUea {
  clave: string;
  nombre: string;
  /** Letra de grupo; null mientras `planStatus` es PENDING o en inscripción en blanco. */
  grupo: string | null;
  professorName: string | null;
  schedule: DaySchedule[] | null;
}

/**
 * HU-61 — una entrada por trimestre en que el alumno respondió la encuesta o fue
 * agregado a una planeación TERMINADA. Solo lectura: nunca muestra letras provisionales.
 */
export interface EnrollmentHistoryEntry {
  term: string;
  /** I..XII declarado en la encuesta; null si lo agregaron a mano. */
  academicTermSelected: string | null;
  mode: SurveyMode | null;
  planStatus: EnrollmentHistoryPlanStatus;
  note: EnrollmentHistoryNote | null;
  ueas: EnrollmentHistoryUea[];
}
