import { Injectable } from '@angular/core';

import { mockApiError } from '../../../core/errors/testing/mock-api-error.util';
import {
  CreateSurveyRequest,
  InterestedStudent,
  StudentSurveyForm,
  SubmitResponseRequest,
  SubmittedResponse,
  SurveyResponse,
  SurveyResultsSummary,
  SurveyStatus,
  UeaDemandRow,
  UpdateSurveyRequest,
} from '../../../models';
import { UEA_CATALOG_SEED } from '../../../shared/mocks/uea-catalog.mock-data';
import { UeaDemandSort } from '../repositories/enrollment-survey.repository';

interface CatalogUea {
  id: number;
  clave: string;
  nombre: string;
  creditos: number;
  tipoFormacion: string;
  active: boolean;
}

interface EligibleStudent {
  id: number;
  fullName: string;
  enrollmentId: string;
  programType: 'MAESTRIA' | 'DOCTORADO';
}

interface StoredResponse {
  studentId: number;
  academicTerm: string;
  mode: 'ENROLL_UEAS' | 'BLANK';
  ueaIds: number[];
  submittedAt: string;
}

interface SurveyRecord {
  id: number;
  term: string;
  opensAt: string;
  closesAt: string;
  introMessage: string | null;
  closedManually: boolean;
  snapshotUeaIds: number[];
  responses: StoredResponse[];
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** The signed-in student for HU-41 flows (getActive / submit / myResponse). */
const CURRENT_STUDENT_ID = 1;

@Injectable({ providedIn: 'root' })
export class EnrollmentSurveyMockStore {
  // Reuses the real institutional UEA catalog seed (clave/nombre/tipoFormacion/creditos/active).
  private readonly catalog: CatalogUea[] = UEA_CATALOG_SEED.map((uea) => ({
    id: uea.id,
    clave: uea.clave,
    nombre: uea.nombre,
    creditos: uea.creditos,
    tipoFormacion: uea.tipoFormacion,
    active: uea.active,
  }));

  private readonly students: EligibleStudent[] = [
    { id: 1, fullName: 'Ana López Ramírez', enrollmentId: '2024630001', programType: 'MAESTRIA' },
    { id: 2, fullName: 'Bruno Díaz Soto', enrollmentId: '2024630002', programType: 'MAESTRIA' },
    { id: 3, fullName: 'Carla Núñez Vega', enrollmentId: '2024630003', programType: 'DOCTORADO' },
    { id: 4, fullName: 'Diego Ruiz Mena', enrollmentId: '2024630004', programType: 'MAESTRIA' },
    { id: 5, fullName: 'Elena Torres Gil', enrollmentId: '2024630005', programType: 'DOCTORADO' },
  ];

  private surveys: SurveyRecord[] = this.seedSurveys();

  private seedSurveys(): SurveyRecord[] {
    const now = Date.now();
    const iso = (offsetMs: number): string => new Date(now + offsetMs).toISOString();
    return [
      {
        id: 3,
        term: '27I',
        opensAt: iso(3 * DAY),
        closesAt: iso(10 * DAY),
        introMessage: null,
        closedManually: false,
        snapshotUeaIds: [1, 2, 3, 4, 5],
        responses: [],
      },
      {
        id: 2,
        term: '26O',
        opensAt: iso(-2 * DAY),
        closesAt: iso(5 * DAY),
        introMessage: 'Recuerda que este sondeo no equivale a una inscripción oficial.',
        closedManually: false,
        // id 36 is inactive in the seed → drives removedUeaClaves for this active survey.
        snapshotUeaIds: [1, 2, 3, 4, 5, 36],
        responses: [
          {
            studentId: 2,
            academicTerm: 'III',
            mode: 'ENROLL_UEAS',
            ueaIds: [1, 3],
            submittedAt: iso(-1 * DAY),
          },
          {
            studentId: 3,
            academicTerm: 'V',
            mode: 'ENROLL_UEAS',
            ueaIds: [3, 4],
            submittedAt: iso(-1 * DAY),
          },
          {
            studentId: 4,
            academicTerm: 'I',
            mode: 'BLANK',
            ueaIds: [],
            submittedAt: iso(-1 * DAY),
          },
        ],
      },
      {
        id: 1,
        term: '26I',
        opensAt: iso(-40 * DAY),
        closesAt: iso(-20 * DAY),
        introMessage: null,
        closedManually: false,
        snapshotUeaIds: [1, 2, 5],
        responses: [
          {
            studentId: 1,
            academicTerm: 'II',
            mode: 'ENROLL_UEAS',
            ueaIds: [1],
            submittedAt: iso(-30 * DAY),
          },
          {
            studentId: 5,
            academicTerm: 'IV',
            mode: 'ENROLL_UEAS',
            ueaIds: [1, 2],
            submittedAt: iso(-30 * DAY),
          },
        ],
      },
    ];
  }

  // ---- HU-40 coordinator ----

  listSurveys(): SurveyResponse[] {
    return [...this.surveys].sort((a, b) => b.id - a.id).map((s) => this.toResponse(s));
  }

  getSurvey(id: number): SurveyResponse {
    return this.toResponse(this.requireSurvey(id));
  }

  createSurvey(request: CreateSurveyRequest): SurveyResponse {
    this.validateDates(request);
    if (this.surveys.some((s) => s.term.toUpperCase() === request.term.toUpperCase())) {
      throw mockApiError({
        status: 409,
        error: 'SURVEY_ALREADY_EXISTS_FOR_TERM',
        message: 'Ya existe un sondeo para ese trimestre.',
      });
    }
    const record: SurveyRecord = {
      id: this.nextId(),
      term: request.term,
      opensAt: request.opensAt,
      closesAt: request.closesAt,
      introMessage: request.introMessage ?? null,
      closedManually: false,
      snapshotUeaIds: this.activeCatalogIds(),
      responses: [],
    };
    this.surveys = [record, ...this.surveys];
    return this.toResponse(record);
  }

  updateSurvey(id: number, request: UpdateSurveyRequest): SurveyResponse {
    this.validateDates(request);
    const record = this.requireSurvey(id);
    const wasClosed = this.deriveStatus(record) === 'CERRADO';
    record.term = request.term;
    record.opensAt = request.opensAt;
    record.closesAt = request.closesAt;
    record.introMessage = request.introMessage ?? null;
    if (wasClosed) {
      // Reopen: clear the manual close and recompute the UEA snapshot (spec HU-40 note 2).
      record.closedManually = false;
      record.snapshotUeaIds = this.activeCatalogIds();
    }
    return this.toResponse(record);
  }

  closeSurvey(id: number): SurveyResponse {
    const record = this.requireSurvey(id);
    if (this.deriveStatus(record) !== 'ACTIVO') {
      throw mockApiError({
        status: 409,
        error: 'SURVEY_NOT_ACTIVE',
        message: 'El sondeo no está activo.',
      });
    }
    record.closedManually = true;
    return this.toResponse(record);
  }

  deleteSurvey(id: number): void {
    const record = this.requireSurvey(id);
    if (this.deriveStatus(record) !== 'PROGRAMADO' || this.responseCount(record) > 0) {
      throw mockApiError({
        status: 409,
        error: 'SURVEY_NOT_DELETABLE',
        message: 'Solo puede eliminarse un sondeo programado sin respuestas.',
      });
    }
    this.surveys = this.surveys.filter((s) => s.id !== id);
  }

  // ---- HU-41 student ----

  /** Returns the active survey form, or null when no survey is ACTIVO. */
  getActiveSurvey(): StudentSurveyForm | null {
    const record = this.surveys.find((s) => this.deriveStatus(s) === 'ACTIVO');
    if (!record) return null;
    const student = this.requireStudent(CURRENT_STUDENT_ID);
    return {
      survey: this.toResponse(record),
      student: {
        fullName: student.fullName,
        enrollmentId: student.enrollmentId,
        programType: student.programType,
      },
      availableUeas: this.catalog
        .filter((u) => u.active)
        .map((u) => ({ id: u.id, clave: u.clave, nombre: u.nombre, creditos: u.creditos })),
      removedUeaClaves: this.removedClaves(record),
      myResponse: this.toSubmitted(
        record.responses.find((r) => r.studentId === CURRENT_STUDENT_ID),
      ),
    };
  }

  submitResponse(id: number, request: SubmitResponseRequest): SubmittedResponse {
    const record = this.requireSurvey(id);
    if (this.deriveStatus(record) !== 'ACTIVO') {
      throw mockApiError({
        status: 409,
        error: 'SURVEY_NOT_ACTIVE',
        message: 'El sondeo no está activo.',
      });
    }
    if (request.mode === 'BLANK' && request.ueaIds.length > 0) {
      throw mockApiError({
        status: 400,
        error: 'BLANK_WITH_UEAS_CONFLICT',
        message: 'No puedes seleccionar UEAs junto con una inscripción en blanco.',
      });
    }
    if (request.mode === 'ENROLL_UEAS') {
      const available = new Set(this.catalog.filter((u) => u.active).map((u) => u.id));
      if (request.ueaIds.length === 0 || request.ueaIds.some((ueaId) => !available.has(ueaId))) {
        throw mockApiError({
          status: 409,
          error: 'UEA_NOT_AVAILABLE',
          message: 'Una o más UEA seleccionadas ya no están disponibles. Actualiza tu selección.',
        });
      }
    }
    const stored: StoredResponse = {
      studentId: CURRENT_STUDENT_ID,
      academicTerm: request.academicTerm,
      mode: request.mode,
      ueaIds: request.mode === 'BLANK' ? [] : [...request.ueaIds],
      submittedAt: new Date().toISOString(),
    };
    // Upsert by student: one response per student per survey.
    record.responses = [
      ...record.responses.filter((r) => r.studentId !== CURRENT_STUDENT_ID),
      stored,
    ];
    return this.toSubmitted(stored)!;
  }

  getMyResponse(id: number): SubmittedResponse {
    const record = this.requireSurvey(id);
    const response = record.responses.find((r) => r.studentId === CURRENT_STUDENT_ID);
    if (!response) {
      throw mockApiError({ status: 404, error: 'RESPONSE_NOT_FOUND', message: 'Sin respuesta.' });
    }
    return this.toSubmitted(response)!;
  }

  // ---- HU-42 coordinator results ----

  getResultsSummary(id: number): SurveyResultsSummary {
    const record = this.requireSurvey(id);
    const respondedCount = this.responseCount(record);
    const eligibleCount = this.students.length;
    return {
      eligibleCount,
      respondedCount,
      pendingCount: Math.max(eligibleCount - respondedCount, 0),
    };
  }

  getResultsUeas(id: number, sort?: UeaDemandSort): UeaDemandRow[] {
    const record = this.requireSurvey(id);
    const rows: UeaDemandRow[] = record.snapshotUeaIds
      .map((ueaId) => this.catalog.find((u) => u.id === ueaId))
      .filter((u): u is CatalogUea => u !== undefined)
      .map((u) => ({
        ueaId: u.id,
        clave: u.clave,
        nombre: u.nombre,
        tipoFormacion: u.tipoFormacion,
        creditos: u.creditos,
        totalResponses: record.responses.filter((r) => r.ueaIds.includes(u.id)).length,
      }));
    if (sort) {
      const sign = sort === 'totalResponses,asc' ? 1 : -1;
      rows.sort((a, b) => (a.totalResponses - b.totalResponses) * sign);
    }
    return rows;
  }

  getResultsUeaStudents(id: number, ueaId: number): InterestedStudent[] {
    const record = this.requireSurvey(id);
    return record.responses
      .filter((r) => r.ueaIds.includes(ueaId))
      .map((r) => this.students.find((s) => s.id === r.studentId))
      .filter((s): s is EligibleStudent => s !== undefined)
      .map((s) => ({ fullName: s.fullName, enrollmentId: s.enrollmentId }));
  }

  // ---- helpers ----

  private deriveStatus(record: SurveyRecord): SurveyStatus {
    if (record.closedManually) return 'CERRADO';
    const now = Date.now();
    if (now < Date.parse(record.opensAt)) return 'PROGRAMADO';
    if (now < Date.parse(record.closesAt)) return 'ACTIVO';
    return 'CERRADO';
  }

  private responseCount(record: SurveyRecord): number {
    return new Set(record.responses.map((r) => r.studentId)).size;
  }

  private removedClaves(record: SurveyRecord): string[] {
    return record.snapshotUeaIds
      .map((ueaId) => this.catalog.find((u) => u.id === ueaId))
      .filter((u): u is CatalogUea => u !== undefined && !u.active)
      .map((u) => u.clave);
  }

  private activeCatalogIds(): number[] {
    return this.catalog.filter((u) => u.active).map((u) => u.id);
  }

  private toResponse(record: SurveyRecord): SurveyResponse {
    return {
      id: record.id,
      term: record.term,
      status: this.deriveStatus(record),
      opensAt: record.opensAt,
      closesAt: record.closesAt,
      introMessage: record.introMessage,
      responseCount: this.responseCount(record),
      suggestedTerm: null,
    };
  }

  private toSubmitted(response: StoredResponse | undefined): SubmittedResponse | null {
    if (!response) return null;
    return {
      academicTerm: response.academicTerm,
      mode: response.mode,
      ueaIds: [...response.ueaIds],
      totalUeas: response.ueaIds.length,
      submittedAt: response.submittedAt,
    };
  }

  private validateDates(request: CreateSurveyRequest): void {
    if (Date.parse(request.closesAt) <= Date.parse(request.opensAt)) {
      throw mockApiError({
        status: 400,
        error: 'VALIDATION_ERROR',
        message: 'La fecha de cierre debe ser posterior a la de apertura.',
      });
    }
  }

  private requireSurvey(id: number): SurveyRecord {
    const record = this.surveys.find((s) => s.id === id);
    if (!record) {
      throw mockApiError({
        status: 404,
        error: 'SURVEY_NOT_FOUND',
        message: 'No existe un sondeo para ese trimestre.',
      });
    }
    return record;
  }

  private requireStudent(id: number): EligibleStudent {
    const student = this.students.find((s) => s.id === id);
    if (!student) {
      throw mockApiError({
        status: 404,
        error: 'SURVEY_NOT_FOUND',
        message: 'Alumno no encontrado.',
      });
    }
    return student;
  }

  private nextId(): number {
    return this.surveys.reduce((max, s) => Math.max(max, s.id), 0) + 1;
  }
}
