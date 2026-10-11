import { Injectable } from '@angular/core';

import { mockApiError } from '../../../core/errors/testing/mock-api-error.util';
import {
  Degree,
  DocumentType,
  EligibilityReason,
  ExamOptionsDto,
  ExamRequirementDto,
  ExamRequirementsResponse,
  ExamType,
  ProgramStatus,
} from '../../../models';

/**
 * Datos demo de HU-62. Borrar este módulo para quitar todo el mock de examen.
 */
export type ExamRequestMockScenario =
  | 'especializacion'
  | 'maestria-emanuel'
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

interface ScenarioDefinition {
  degree: Degree;
  programStatus: ProgramStatus;
  eligible: boolean;
  eligibilityReason: EligibilityReason | null;
  personFileName: string;
  includeArticle: boolean;
  emptyRequirements: boolean;
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

function articleRequirement(): ExamRequirementDto {
  return {
    documentType: 'ARTICULO',
    required: true,
    acceptedKinds: ['PDF', 'URL'],
    expectedName: null,
    exampleName: null,
    status: 'PENDIENTE',
    currentDocument: null,
  };
}

function buildRequirements(definition: ScenarioDefinition): ExamRequirementDto[] {
  if (definition.emptyRequirements) {
    return [];
  }

  const items: ExamRequirementDto[] = [];
  for (const type of DOCUMENT_ORDER) {
    if (type === 'ARTICULO') {
      if (definition.includeArticle) {
        items.push(articleRequirement());
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

function toOptions(definition: ScenarioDefinition): ExamOptionsDto {
  return {
    degree: definition.degree,
    programStatus: definition.programStatus,
    eligible: definition.eligible,
    eligibilityReason: definition.eligibilityReason,
    examTypes: definition.degree === 'DOCTORADO' ? ['GRADO', 'PREDOCTORAL'] : ['GRADO'],
  };
}

@Injectable({ providedIn: 'root' })
export class ExamRequestMockStore {
  private scenario: ExamRequestMockScenario = 'maestria-emanuel';

  setScenario(scenario: ExamRequestMockScenario): void {
    this.scenario = scenario;
  }

  getScenario(): ExamRequestMockScenario {
    return this.scenario;
  }

  getOptions(): ExamOptionsDto {
    return toOptions(SCENARIOS[this.scenario]);
  }

  getRequirements(examType: ExamType): ExamRequirementsResponse {
    const definition = SCENARIOS[this.scenario];
    if (examType === 'PREDOCTORAL' && definition.degree !== 'DOCTORADO') {
      throw mockApiError({
        status: 403,
        error: 'EXAM_TYPE_NOT_ALLOWED',
        message: 'Predoctoral is not available for this program',
      });
    }

    const options = toOptions(definition);
    return {
      examType,
      degree: options.degree,
      programStatus: options.programStatus,
      eligible: options.eligible,
      eligibilityReason: options.eligibilityReason,
      request: null,
      requirements: buildRequirements(definition),
    };
  }
}
