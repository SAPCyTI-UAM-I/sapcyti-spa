import { Injectable } from '@angular/core';

import { mockApiError } from '../../../core/errors/testing/mock-api-error.util';
import {
  Degree,
  DocumentDto,
  DocumentType,
  EligibilityReason,
  ExamOptionsDto,
  ExamPanelResponse,
  ExamRequestDto,
  ExamRequestStatus,
  ExamRequestSummaryDto,
  ExamRequirementDto,
  ExamRequirementsResponse,
  ExamType,
  MutationResponse,
  ProgramStatus,
  SaveDocumentsResponse,
  SaveResult,
} from '../../../models';
import type { ReplaceDocumentCommand } from '../repositories/exam-request.repository';
import type { SaveDocumentSelection } from '../utils/exam-document-form-data.util';
import { matchesExpectedDocumentName } from '../utils/exam-document-validation.util';

/**
 * Datos demo de HU-62/HU-65. Borrar este módulo para quitar todo el mock de examen.
 */
export type ExamRequestMockScenario =
  | 'especializacion'
  | 'maestria-emanuel'
  | 'maestria-parcial'
  | 'doctorado'
  | 'egresado'
  | 'baja'
  | 'suspension'
  | 'empty-invalid';

const DOCUMENT_ORDER: readonly DocumentType[] = [
  'TESIS',
  'ARTICULO',
  'SOL_SINODALES',
  'HIST_ACAD',
  'COMP_IDIOMA',
  'DATOS_ALUM',
];

/** Prefijos canónicos del contrato API (español). La UI localiza al mostrar. */
const NAME_PREFIX: Record<Exclude<DocumentType, 'ARTICULO'>, string> = {
  TESIS: 'Tesis',
  SOL_SINODALES: 'Sol_Sinodales',
  HIST_ACAD: 'Hist_Acad',
  COMP_IDIOMA: 'Comp_Idioma',
  DATOS_ALUM: 'Datos_Alum',
};

const DEGREE_CODE: Record<Degree, string> = {
  ESPECIALIZACION: 'Esp',
  MAESTRIA: 'Mtria',
  DOCTORADO: 'Docto',
};

const SEEDED_UPLOADED_AT = '2026-10-09T18:00:00Z';

interface ScenarioDefinition {
  degree: Degree;
  programStatus: ProgramStatus;
  eligible: boolean;
  eligibilityReason: EligibilityReason | null;
  personFileName: string;
  includeArticle: boolean;
  emptyRequirements: boolean;
}

interface PersistState {
  request: {
    id: number;
    status: ExamRequestStatus;
    folio: string | null;
    version: number;
    submittedAt: string | null;
  } | null;
  documents: Partial<Record<DocumentType, DocumentDto>>;
  nextDocumentId: number;
}

const SCENARIOS: Record<ExamRequestMockScenario, ScenarioDefinition> = {
  especializacion: {
    degree: 'ESPECIALIZACION',
    programStatus: 'EN_INVESTIGACION',
    eligible: true,
    eligibilityReason: null,
    personFileName: 'Garcia_Ruiz_Maria',
    includeArticle: false,
    emptyRequirements: false,
  },
  'maestria-emanuel': {
    degree: 'MAESTRIA',
    programStatus: 'EGRESADO',
    eligible: true,
    eligibilityReason: null,
    personFileName: 'Lopez_Alba_Emanuel',
    includeArticle: false,
    emptyRequirements: false,
  },
  'maestria-parcial': {
    degree: 'MAESTRIA',
    programStatus: 'EGRESADO',
    eligible: true,
    eligibilityReason: null,
    personFileName: 'Lopez_Alba_Emanuel',
    includeArticle: false,
    emptyRequirements: false,
  },
  doctorado: {
    degree: 'DOCTORADO',
    programStatus: 'EN_INVESTIGACION',
    eligible: true,
    eligibilityReason: null,
    personFileName: 'Perez_Soto_Luis',
    includeArticle: true,
    emptyRequirements: false,
  },
  egresado: {
    degree: 'MAESTRIA',
    programStatus: 'EGRESADO',
    eligible: true,
    eligibilityReason: null,
    personFileName: 'Lopez_Alba_Emanuel',
    includeArticle: false,
    emptyRequirements: false,
  },
  baja: {
    degree: 'MAESTRIA',
    programStatus: 'BAJA',
    eligible: false,
    eligibilityReason: 'PROGRAM_BAJA',
    personFileName: 'Lopez_Alba_Emanuel',
    includeArticle: false,
    emptyRequirements: false,
  },
  suspension: {
    degree: 'MAESTRIA',
    programStatus: 'SUSPENSION',
    eligible: false,
    eligibilityReason: 'PROGRAM_SUSPENSION',
    personFileName: 'Lopez_Alba_Emanuel',
    includeArticle: false,
    emptyRequirements: false,
  },
  'empty-invalid': {
    degree: 'MAESTRIA',
    programStatus: 'EN_INVESTIGACION',
    eligible: true,
    eligibilityReason: null,
    personFileName: 'Lopez_Alba_Emanuel',
    includeArticle: false,
    emptyRequirements: true,
  },
};

function thesisName(degree: Degree, personFileName: string): string {
  return `Tesis_${DEGREE_CODE[degree]}_${personFileName}.pdf`;
}

function prescribedName(type: Exclude<DocumentType, 'ARTICULO'>, personFileName: string): string {
  return `${NAME_PREFIX[type]}_${personFileName}.pdf`;
}

function pdfRequirement(
  documentType: Exclude<DocumentType, 'ARTICULO'>,
  expectedName: string,
): ExamRequirementDto {
  return {
    documentType,
    required: true,
    acceptedKinds: ['PDF'],
    expectedName,
    exampleName: expectedName,
    status: 'PENDIENTE',
    currentDocument: null,
  };
}

function articleRequirement(required: boolean): ExamRequirementDto {
  return {
    documentType: 'ARTICULO',
    required,
    acceptedKinds: ['PDF', 'URL'],
    expectedName: null,
    exampleName: null,
    status: 'PENDIENTE',
    currentDocument: null,
  };
}

function buildRequirements(
  definition: ScenarioDefinition,
  examType: ExamType,
): ExamRequirementDto[] {
  if (definition.emptyRequirements) {
    return [];
  }

  const items: ExamRequirementDto[] = [];
  for (const type of DOCUMENT_ORDER) {
    if (type === 'ARTICULO') {
      if (definition.includeArticle) {
        // Artículo opcional solo en PREDOCTORAL; en GRADO doctoral sigue obligatorio.
        items.push(articleRequirement(examType !== 'PREDOCTORAL'));
      }
      continue;
    }

    const fileName =
      type === 'TESIS'
        ? thesisName(definition.degree, definition.personFileName)
        : prescribedName(type, definition.personFileName);
    items.push(pdfRequirement(type, fileName));
  }

  return items;
}

function seedPdf(
  id: number,
  documentType: DocumentType,
  originalName: string,
  sizeBytes: number,
): DocumentDto {
  return {
    id,
    documentType,
    kind: 'PDF',
    originalName,
    externalUrl: null,
    sizeBytes,
    uploadedAt: SEEDED_UPLOADED_AT,
  };
}

function toOptions(definition: ScenarioDefinition): ExamOptionsDto {
  return {
    degree: definition.degree,
    programStatus: definition.programStatus,
    eligible: definition.eligible,
    eligibilityReason: definition.eligibilityReason,
    examTypes: definition.degree === 'DOCTORADO' ? ['GRADO', 'PREDOCTORAL'] : ['GRADO'],
  };
}

function isHttpsUrl(value: string): boolean {
  return value.startsWith('https://') && value.length > 'https://'.length;
}

@Injectable({ providedIn: 'root' })
export class ExamRequestMockStore {
  private scenario: ExamRequestMockScenario = 'maestria-emanuel';
  private readonly states = new Map<ExamType, PersistState>();
  private nextRequestId = 6401;

  setScenario(scenario: ExamRequestMockScenario): void {
    this.scenario = scenario;
    this.states.clear();
    this.nextRequestId = 6401;
  }

  getScenario(): ExamRequestMockScenario {
    return this.scenario;
  }

  getOptions(): ExamOptionsDto {
    return toOptions(SCENARIOS[this.scenario]);
  }

  getRequirements(examType: ExamType): ExamRequirementsResponse {
    const snapshot = this.readSnapshot(examType);
    return {
      examType: snapshot.examType,
      degree: snapshot.degree,
      programStatus: snapshot.programStatus,
      eligible: snapshot.eligible,
      eligibilityReason: snapshot.eligibilityReason,
      request: snapshot.request ? toSummary(snapshot.request) : null,
      requirements: snapshot.requirements,
    };
  }

  getPanel(examType: ExamType): ExamPanelResponse {
    const snapshot = this.readSnapshot(examType);
    return {
      examType: snapshot.examType,
      degree: snapshot.degree,
      programStatus: snapshot.programStatus,
      eligible: snapshot.eligible,
      eligibilityReason: snapshot.eligibilityReason,
      request: snapshot.request,
      requirements: snapshot.requirements,
      requiredPendingCount: countRequiredPending(snapshot.requirements),
    };
  }

  saveDocuments(
    examType: ExamType,
    version: number,
    selections: readonly SaveDocumentSelection[],
  ): SaveDocumentsResponse {
    const state = this.assertWritable(examType);
    if (selections.length < 1 || selections.length > 6) {
      throw mockApiError({
        status: 400,
        error: 'VALIDATION_ERROR',
        message: 'The save envelope is invalid',
      });
    }

    this.assertVersion(state, version, 0);

    const catalog = this.catalog(examType);
    const results: SaveResult[] = selections.map((selection) =>
      this.evaluateSelection(selection, catalog),
    );
    const saved = results.filter(
      (result): result is Extract<SaveResult, { status: 'SAVED' }> => result.status === 'SAVED',
    );

    // Solo incrementa versión si al menos un documento se persistió.
    if (saved.length > 0) {
      this.commitSaved(state, saved);
    }

    const snapshot = this.readSnapshot(examType);
    return {
      request: snapshot.request,
      version: snapshot.request?.version ?? 0,
      results: this.withPersistedDocuments(results, state),
    };
  }

  replaceDocument(
    examType: ExamType,
    documentType: DocumentType,
    command: ReplaceDocumentCommand,
  ): MutationResponse {
    const state = this.assertWritable(examType);
    if (!state.request) {
      throw mockApiError({
        status: 404,
        error: 'REQUEST_NOT_FOUND',
        message: 'Draft request was not found',
      });
    }

    this.assertVersion(state, command.version, 1);

    const catalog = this.catalog(examType);
    const selection: SaveDocumentSelection =
      command.kind === 'PDF'
        ? { documentType, kind: 'PDF', file: command.file }
        : { documentType, kind: 'URL', url: command.externalUrl };
    const evaluated = this.evaluateSelection(selection, catalog);
    if (evaluated.status === 'ERROR') {
      throw mockApiError({
        status: 400,
        error: evaluated.error.error,
        message: evaluated.error.message,
        details: evaluated.error.details,
      });
    }

    const document = this.persistDocument(state, evaluated.document);
    state.request.version += 1;
    return {
      request: this.readSnapshot(examType).request!,
      version: state.request.version,
      document,
    };
  }

  deleteDocument(
    examType: ExamType,
    documentType: DocumentType,
    version: number,
  ): MutationResponse {
    const state = this.assertWritable(examType);
    if (!state.request) {
      throw mockApiError({
        status: 404,
        error: 'REQUEST_NOT_FOUND',
        message: 'Draft request was not found',
      });
    }

    this.assertVersion(state, version, 1);

    if (!state.documents[documentType]) {
      throw mockApiError({
        status: 404,
        error: 'DOCUMENT_NOT_FOUND',
        message: 'Document was not found',
      });
    }

    delete state.documents[documentType];
    state.request.version += 1;
    return {
      request: this.readSnapshot(examType).request!,
      version: state.request.version,
      document: null,
    };
  }

  private readSnapshot(examType: ExamType): {
    examType: ExamType;
    degree: Degree;
    programStatus: ProgramStatus;
    eligible: boolean;
    eligibilityReason: EligibilityReason | null;
    request: ExamRequestDto | null;
    requirements: ExamRequirementDto[];
  } {
    const definition = this.assertReadable(examType);
    const options = toOptions(definition);
    const state = this.ensureState(examType);
    const requirements = applyDocuments(this.catalog(examType), state.documents);

    return {
      examType,
      degree: options.degree,
      programStatus: options.programStatus,
      eligible: options.eligible,
      eligibilityReason: options.eligibilityReason,
      request: state.request
        ? {
            id: state.request.id,
            examType,
            degree: options.degree,
            status: state.request.status,
            folio: state.request.folio,
            version: state.request.version,
            submittedAt: state.request.submittedAt,
            requirements,
            delivery: null,
          }
        : null,
      requirements,
    };
  }

  private catalog(examType: ExamType): ExamRequirementDto[] {
    return buildRequirements(SCENARIOS[this.scenario], examType);
  }

  private assertReadable(examType: ExamType): ScenarioDefinition {
    const definition = SCENARIOS[this.scenario];
    if (examType === 'PREDOCTORAL' && definition.degree !== 'DOCTORADO') {
      throw mockApiError({
        status: 403,
        error: 'EXAM_TYPE_NOT_ALLOWED',
        message: 'Predoctoral is not available for this program',
      });
    }

    return definition;
  }

  private assertWritable(examType: ExamType): PersistState {
    const definition = this.assertReadable(examType);
    if (!definition.eligible) {
      throw mockApiError({
        status: 403,
        error: 'PROGRAM_NOT_ELIGIBLE',
        message: 'Program is not eligible',
      });
    }

    const state = this.ensureState(examType);
    if (state.request && state.request.status !== 'BORRADOR') {
      throw mockApiError({
        status: 409,
        error: 'REQUEST_NOT_DRAFT',
        message: 'The request is not a draft',
      });
    }

    return state;
  }

  private assertVersion(state: PersistState, version: number, minWhenMissing: 0 | 1): void {
    const expected = state.request ? state.request.version : minWhenMissing;
    if (version !== expected) {
      throw mockApiError({
        status: 409,
        error: 'VERSION_CONFLICT',
        message: 'The request was changed by another operation',
        details: {
          fieldErrors: [{ field: 'version', code: 'STALE_VERSION', message: 'Reload the request' }],
        },
      });
    }
  }

  private ensureState(examType: ExamType): PersistState {
    const existing = this.states.get(examType);
    if (existing) {
      return existing;
    }

    const created = this.seedState(examType);
    this.states.set(examType, created);
    return created;
  }

  private seedState(examType: ExamType): PersistState {
    const definition = SCENARIOS[this.scenario];

    if (this.scenario === 'maestria-parcial' && examType === 'GRADO') {
      const person = definition.personFileName;
      return {
        request: {
          id: 41,
          status: 'BORRADOR',
          folio: null,
          version: 3,
          submittedAt: null,
        },
        documents: {
          TESIS: seedPdf(88, 'TESIS', thesisName(definition.degree, person), 204800),
          SOL_SINODALES: seedPdf(
            89,
            'SOL_SINODALES',
            prescribedName('SOL_SINODALES', person),
            102400,
          ),
          HIST_ACAD: seedPdf(90, 'HIST_ACAD', prescribedName('HIST_ACAD', person), 102400),
        },
        nextDocumentId: 91,
      };
    }

    if (definition.degree === 'DOCTORADO' && examType === 'PREDOCTORAL') {
      return {
        request: {
          id: 6301,
          status: 'ENVIADA',
          folio: 'SEG-184201-110001',
          version: 1,
          submittedAt: '2026-03-15T10:00:00.000Z',
        },
        documents: {},
        nextDocumentId: 88,
      };
    }

    if (definition.degree === 'DOCTORADO' && examType === 'GRADO') {
      return {
        request: {
          id: 6302,
          status: 'BORRADOR',
          folio: null,
          version: 1,
          submittedAt: null,
        },
        documents: {},
        nextDocumentId: 88,
      };
    }

    return { request: null, documents: {}, nextDocumentId: 88 };
  }

  private evaluateSelection(
    selection: SaveDocumentSelection,
    catalog: readonly ExamRequirementDto[],
  ): SaveResult {
    const requirement = catalog.find((item) => item.documentType === selection.documentType);
    if (!requirement || !requirement.acceptedKinds.includes(selection.kind)) {
      return {
        documentType: selection.documentType,
        status: 'ERROR',
        error: {
          error: 'DOCUMENT_KIND_NOT_ALLOWED',
          message: 'Document kind is not allowed',
        },
      };
    }

    if (selection.kind === 'URL') {
      if (selection.documentType !== 'ARTICULO' || !isHttpsUrl(selection.url)) {
        return {
          documentType: selection.documentType,
          status: 'ERROR',
          error: { error: 'INVALID_ARTICLE_URL', message: 'Invalid article URL' },
        };
      }

      return {
        documentType: selection.documentType,
        status: 'SAVED',
        document: {
          id: 0,
          documentType: selection.documentType,
          kind: 'URL',
          originalName: null,
          externalUrl: selection.url,
          sizeBytes: null,
          uploadedAt: SEEDED_UPLOADED_AT,
        },
      };
    }

    // Misma regla que HU-64: solo el expectedName del DTO, nunca un alumno fijo.
    if (
      selection.documentType !== 'ARTICULO' &&
      requirement.expectedName &&
      !matchesExpectedDocumentName(selection.file.name, requirement.expectedName)
    ) {
      return {
        documentType: selection.documentType,
        status: 'ERROR',
        error: {
          error: 'INVALID_DOCUMENT_NAME',
          message: 'Invalid filename',
          details: { expectedName: requirement.expectedName },
        },
      };
    }

    return {
      documentType: selection.documentType,
      status: 'SAVED',
      document: {
        id: 0,
        documentType: selection.documentType,
        kind: 'PDF',
        originalName: selection.file.name,
        externalUrl: null,
        sizeBytes: selection.file.size,
        uploadedAt: SEEDED_UPLOADED_AT,
      },
    };
  }

  private commitSaved(
    state: PersistState,
    saved: Array<Extract<SaveResult, { status: 'SAVED' }>>,
  ): void {
    if (!state.request) {
      state.request = {
        id: this.nextRequestId++,
        status: 'BORRADOR',
        folio: null,
        version: 1,
        submittedAt: null,
      };
    } else {
      state.request.version += 1;
    }

    // Guardar nunca genera folio ni intención de correo.
    state.request.folio = null;
    state.request.submittedAt = null;
    state.request.status = 'BORRADOR';

    for (const result of saved) {
      this.persistDocument(state, result.document);
    }
  }

  private persistDocument(state: PersistState, document: DocumentDto): DocumentDto {
    const persisted = { ...document, id: state.nextDocumentId++ };
    state.documents[document.documentType] = persisted;
    return persisted;
  }

  private withPersistedDocuments(results: SaveResult[], state: PersistState): SaveResult[] {
    return results.map((result) => {
      if (result.status !== 'SAVED') {
        return result;
      }

      const persisted = state.documents[result.documentType];
      return persisted ? { ...result, document: persisted } : result;
    });
  }
}

function applyDocuments(
  catalog: ExamRequirementDto[],
  documents: Partial<Record<DocumentType, DocumentDto>>,
): ExamRequirementDto[] {
  return catalog.map((item) => {
    const currentDocument = documents[item.documentType] ?? null;
    return {
      ...item,
      acceptedKinds: [...item.acceptedKinds],
      currentDocument,
      status: currentDocument ? 'CARGADO' : 'PENDIENTE',
    };
  });
}

function countRequiredPending(requirements: readonly ExamRequirementDto[]): number {
  return requirements.filter((item) => item.required && item.status === 'PENDIENTE').length;
}

function toSummary(request: ExamRequestDto): ExamRequestSummaryDto {
  return {
    id: request.id,
    examType: request.examType,
    degree: request.degree,
    status: request.status,
    folio: request.folio,
    version: request.version,
    submittedAt: request.submittedAt,
  };
}
