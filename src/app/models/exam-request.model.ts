import type { ProgramStatus } from './student-program.model';

/** Tipos de examen. PREDOCTORAL es extensión HU-63; HU-62 solo consulta GRADO. */
export type ExamType = 'GRADO' | 'PREDOCTORAL';

/** Grado del programa del alumno; no se elige en la pantalla. */
export type Degree = 'ESPECIALIZACION' | 'MAESTRIA' | 'DOCTORADO';

export type DocumentType =
  | 'TESIS'
  | 'ARTICULO'
  | 'SOL_SINODALES'
  | 'HIST_ACAD'
  | 'COMP_IDIOMA'
  | 'DATOS_ALUM';

export type DocumentKind = 'PDF' | 'URL';

export type RequirementStatus = 'PENDIENTE' | 'CARGADO';

export type ExamRequestStatus = 'BORRADOR' | 'ENVIADA' | 'ACTUALIZADA' | 'CERRADA';

/** Motivo estable de inelegibilidad; null si el alumno puede tramitar. */
export type EligibilityReason = 'PROGRAM_BAJA' | 'PROGRAM_SUSPENSION';

export interface ExamOptionsDto {
  degree: Degree;
  programStatus: ProgramStatus;
  eligible: boolean;
  eligibilityReason: EligibilityReason | null;
  examTypes: ExamType[];
}

export interface DocumentDto {
  id: number;
  documentType: DocumentType;
  kind: DocumentKind;
  originalName: string | null;
  externalUrl: string | null;
  sizeBytes: number | null;
  uploadedAt: string;
}

export interface ExamRequirementDto {
  documentType: DocumentType;
  required: boolean;
  acceptedKinds: DocumentKind[];
  expectedName: string | null;
  exampleName: string | null;
  status: RequirementStatus;
  currentDocument: DocumentDto | null;
}

export interface ExamRequestSummaryDto {
  id: number;
  examType: ExamType;
  degree: Degree;
  status: ExamRequestStatus;
  folio: string | null;
  version: number;
  submittedAt: string | null;
}

export interface ExamRequirementsResponse {
  examType: ExamType;
  degree: Degree;
  programStatus: ProgramStatus;
  eligible: boolean;
  eligibilityReason: EligibilityReason | null;
  request: ExamRequestSummaryDto | null;
  requirements: ExamRequirementDto[];
}
