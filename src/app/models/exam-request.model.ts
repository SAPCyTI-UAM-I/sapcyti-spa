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

/** Grupos de correo; el panel HU-65 los lee pero no los envía. */
export type DeliveryStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SUPPRESSED' | 'NO_RECIPIENTS';

export type DeliveryGroup = 'COORDINATION' | 'OFFICE' | 'STUDENT';

export interface DeliveryGroupDto {
  group: DeliveryGroup;
  intendedCount: number;
  pendingCount: number;
  sentCount: number;
  failedCount: number;
  suppressedCount: number;
  status: DeliveryStatus;
}

export interface DeliverySummaryDto {
  groups: DeliveryGroupDto[];
  overallStatus: DeliveryStatus;
}

/** Expediente completo del panel; incluye requisitos y delivery. */
export interface ExamRequestDto {
  id: number;
  examType: ExamType;
  degree: Degree;
  status: ExamRequestStatus;
  folio: string | null;
  version: number;
  submittedAt: string | null;
  requirements: ExamRequirementDto[];
  delivery: DeliverySummaryDto | null;
}

/** GET /exam-requests/me/{examType}. requiredPendingCount lo deriva el servidor. */
export interface ExamPanelResponse {
  examType: ExamType;
  degree: Degree;
  programStatus: ProgramStatus;
  eligible: boolean;
  eligibilityReason: EligibilityReason | null;
  request: ExamRequestDto | null;
  requirements: ExamRequirementDto[];
  requiredPendingCount: number;
}

/** Un ítem del manifest POST. PDF lleva filePart; URL lleva externalUrl. */
export interface UploadDescriptor {
  documentType: DocumentType;
  kind: DocumentKind;
  filePart?: string;
  externalUrl?: string;
}

export interface BatchManifest {
  version: number;
  documents: UploadDescriptor[];
}

export interface DocumentErrorDetails {
  expectedName?: string;
  fieldErrors?: Array<{ field: string; code: string; message: string }>;
}

/** Envelope por documento en results[]; message no se muestra en UI. */
export interface DocumentError {
  error: string;
  message: string;
  details?: DocumentErrorDetails;
}

export type SaveResult =
  | { documentType: DocumentType; status: 'SAVED'; document: DocumentDto }
  | { documentType: DocumentType; status: 'ERROR'; error: DocumentError };

export interface SaveDocumentsResponse {
  request: ExamRequestDto | null;
  version: number;
  results: SaveResult[];
}

export interface PutUrlRequest {
  version: number;
  kind: 'URL';
  externalUrl: string;
}

export interface DeleteDocumentRequest {
  version: number;
}

export interface MutationResponse {
  request: ExamRequestDto;
  version: number;
  document: DocumentDto | null;
}
