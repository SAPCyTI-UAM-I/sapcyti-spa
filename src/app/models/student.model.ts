import type { StudentProgramResponse } from './student-program.model';

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
  /** HU-56: trimestre de ingreso, capturado a mano. Formato `AA[OIP]`, ej. `26O`. */
  admissionTerm: string;
  lineOfKnowledge?: string;
  researchArea?: string;
  tutorId?: number | null;
  advisorIds?: number[];
}

export interface StudentCatalogItem extends RegisterStudentRequest {
  id: number;
  userId: number;
  active: boolean;
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
  admissionTerm: string;
  active: boolean;
}

export interface StudentDetailResponse extends StudentCatalogItem {
  /** Programa académico único del alumno. */
  program: StudentProgramResponse;
}
