import { Injectable } from '@angular/core';

import { mockApiError } from '../../../core/errors/testing/mock-api-error.util';
import {
  AcademicTerm,
  BlankStudent,
  GroupProfessor,
  ChangeTrimestralPlanStatusRequest,
  CreateTrimestralPlanRequest,
  DaySchedule,
  GroupStudent,
  PageResponse,
  PlanWarning,
  ProfessorCatalogItem,
  SaveGroupStudentRequest,
  SaveTrimestralPlanRequest,
  SCHEDULE_DAYS,
  StudentCatalogItem,
  SurveyMode,
  SurveyResponse,
  SurveyStatus,
  TrimestralGroup,
  TrimestralPlanDetail,
  TrimestralPlanSummary,
  UnassignedDemand,
  UeaCatalogItem,
} from '../../../models';
import {
  ENROLLED_STUDENTS_SEED,
  EnrolledStudentSeed,
  seedFullName,
  seedToCatalogItem,
} from '../../../shared/mocks/enrolled-students.mock-data';
import { UEA_CATALOG_SEED } from '../../../shared/mocks/uea-catalog.mock-data';
import { baseGroupForTerm, compareByLastNames, groupWithSuffix } from '../utils/group-letter.util';
import { compareTermsDesc } from '../utils/trimestral-plan-status.util';

const DAY = 24 * 60 * 60 * 1000;

/**
 * Survey responses the trimestral plan generates from. The real backend reads these
 * through an outbound port into the `survey` module; the mock restates the seed of
 * `enrollment-survey-mock.store.ts` (same survey ids, terms and picks) because features
 * — and therefore their mock stores — must not import each other.
 *
 * ponytail: duplicación deliberada y acotada; las identidades (alumnos, UEAs) sí vienen
 * de los seeds compartidos, que es donde importa la coherencia entre pantallas.
 */
interface SeedResponse {
  studentId: number;
  academicTerm: AcademicTerm;
  mode: SurveyMode;
  ueaIds: number[];
}

interface SeedSurvey {
  id: number;
  term: string;
  status: SurveyStatus;
  daysFromNow: [open: number, close: number];
  responses: SeedResponse[];
}

/** Avisos que solo la generación puede producir: al guardar grupos no se recalculan. */
const GENERATION_WARNINGS = new Set<PlanWarning['code']>([
  'NO_RESPONSES',
  'UEA_DEACTIVATED',
  'STUDENT_INACTIVE',
]);

/** Dos alumnos que eligen la misma UEA sin cupo son un aviso, no dos. */
function dedupeWarnings(warnings: readonly PlanWarning[]): PlanWarning[] {
  const byKey = new Map(warnings.map((warning) => [JSON.stringify(warning), warning]));
  return [...byKey.values()];
}

const SEED_SURVEYS: SeedSurvey[] = [
  { id: 3, term: '27I', status: 'PROGRAMADO', daysFromNow: [3, 10], responses: [] },
  // Encuesta del plan `outdated` (25I): sin ella, Regenerar —la única acción que ofrece el
  // badge «Desactualizado»— respondería SURVEY_NOT_FOUND y el seed quedaría muerto.
  {
    id: 6,
    term: '25I',
    status: 'CERRADO',
    daysFromNow: [-200, -180],
    responses: [{ studentId: 2, academicTerm: 'III', mode: 'ENROLL_UEAS', ueaIds: [5] }],
  },
  // Cerrada pero solo con inscripciones en blanco: generar de aquí produce un plan sin
  // filas de UEA y el aviso NO_RESPONSES (HU-58).
  {
    id: 4,
    term: '25O',
    status: 'CERRADO',
    daysFromNow: [-120, -100],
    responses: [{ studentId: 4, academicTerm: 'II', mode: 'BLANK', ueaIds: [] }],
  },
  {
    id: 2,
    term: '26O',
    status: 'ACTIVO',
    daysFromNow: [-2, 5],
    responses: [
      { studentId: 2, academicTerm: 'III', mode: 'ENROLL_UEAS', ueaIds: [1, 3] },
      { studentId: 3, academicTerm: 'V', mode: 'ENROLL_UEAS', ueaIds: [3, 4] },
      { studentId: 4, academicTerm: 'I', mode: 'BLANK', ueaIds: [] },
    ],
  },
  {
    id: 1,
    term: '26I',
    status: 'CERRADO',
    daysFromNow: [-40, -20],
    responses: [
      { studentId: 1, academicTerm: 'II', mode: 'ENROLL_UEAS', ueaIds: [1] },
      // La UEA 36 está dada de baja en el catálogo: dispara UEA_DEACTIVATED (HU-58).
      { studentId: 5, academicTerm: 'IV', mode: 'ENROLL_UEAS', ueaIds: [1, 2, 36] },
      { studentId: 3, academicTerm: 'VI', mode: 'BLANK', ueaIds: [] },
    ],
  },
  // 2024 no tiene planeación anual: generar de aquí devuelve ANNUAL_PLAN_REQUIRED (HU-58).
  {
    id: 5,
    term: '24O',
    status: 'CERRADO',
    daysFromNow: [-400, -380],
    responses: [{ studentId: 1, academicTerm: 'I', mode: 'ENROLL_UEAS', ueaIds: [1] }],
  },
];

/**
 * Años con planeación anual. El backend lo consulta al módulo `planning` por un puerto;
 * el mock lo declara porque los features no se importan entre sí.
 */
const ANNUAL_PLAN_YEARS = new Set([2025, 2026, 2027]);

interface PlanProfessor extends ProfessorCatalogItem {
  employeeNumber: string;
}

const PROFESSORS_SEED: PlanProfessor[] = [
  {
    id: 1,
    userId: 201,
    graduateProgramId: 1,
    employeeNumber: '40001',
    firstName: 'Rafaela',
    firstLastName: 'Blanco',
    secondLastName: 'Vargas',
    email: 'rblanco@uam.mx',
    phone: '5500000001',
    professorType: 'INTERNO',
    commissionMember: true,
    active: true,
  },
  {
    id: 2,
    userId: 202,
    graduateProgramId: 1,
    employeeNumber: '40002',
    firstName: 'Humberto',
    firstLastName: 'Cedillo',
    secondLastName: 'Nava',
    email: 'hcedillo@uam.mx',
    phone: '5500000002',
    professorType: 'INTERNO',
    commissionMember: false,
    active: true,
  },
  {
    id: 3,
    userId: 203,
    graduateProgramId: 1,
    employeeNumber: '40003',
    firstName: 'Lucía',
    firstLastName: 'Ontiveros',
    secondLastName: 'Paz',
    email: 'lontiveros@uam.mx',
    phone: '5500000003',
    professorType: 'EXTERNO',
    commissionMember: false,
    active: true,
  },
  // De baja: asignarlo a un grupo y marcar TERMINADA dispara PROFESSOR_INACTIVE (HU-58).
  {
    id: 4,
    userId: 204,
    graduateProgramId: 1,
    employeeNumber: '40004',
    firstName: 'Ernesto',
    firstLastName: 'Salas',
    secondLastName: 'Mora',
    email: 'esalas@uam.mx',
    phone: '5500000004',
    professorType: 'INTERNO',
    commissionMember: false,
    active: false,
  },
];

function emptySchedule(): DaySchedule[] {
  return SCHEDULE_DAYS.map((day) => ({ day, start: null, end: null, lab: false }));
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function findStudent(id: number): EnrolledStudentSeed | undefined {
  return ENROLLED_STUDENTS_SEED.find((s) => s.id === id);
}

/**
 * In-memory mock backing the Trimestral Planning screens. Replicates the API contract:
 * one plan per term, BORRADOR ⇄ TERMINADA, warnings recomputed on every write and
 * `{ error, message }` HttpErrorResponse payloads.
 */
@Injectable({ providedIn: 'root' })
export class TrimestralPlanMockStore {
  private nextGroupId = 500;
  private nextPlanId = 10;
  private plans: TrimestralPlanDetail[] = [
    {
      id: 1,
      term: '26I',
      status: 'BORRADOR',
      surveyId: 1,
      outdated: false,
      outdatedReasons: [],
      prerequisites: { surveyClosed: true, annualPlanTerminated: true },
      exportedAt: null,
      ...buildFromSurvey(SEED_SURVEYS.find((s) => s.id === 1)!, () => this.nextGroupId++),
    },
    seedFinished25P(),
    seedOutdated25I(),
  ];

  // ---- HU-58 ----

  list(): TrimestralPlanSummary[] {
    return this.plans
      .map((plan) => this.toSummary(plan))
      .sort((a, b) => compareTermsDesc(a.term, b.term));
  }

  get(id: number): TrimestralPlanDetail {
    return clone(this.requirePlan(id));
  }

  generate(request: CreateTrimestralPlanRequest): TrimestralPlanDetail {
    const survey = SEED_SURVEYS.find((s) => s.id === request.surveyId);
    if (!survey) {
      throw mockApiError({
        status: 404,
        error: 'SURVEY_NOT_FOUND',
        message: `No existe la encuesta ${request.surveyId}`,
      });
    }
    if (survey.status !== 'CERRADO') {
      throw mockApiError({
        status: 409,
        error: 'SURVEY_NOT_CLOSED',
        message: 'La planeación solo se genera desde una encuesta cerrada.',
      });
    }
    if (this.plans.some((plan) => plan.term === survey.term)) {
      throw mockApiError({
        status: 409,
        error: 'TRIMESTRAL_PLAN_ALREADY_EXISTS',
        message: `Ya existe una planeación para ${survey.term}`,
      });
    }
    // El año de 4 dígitos se deriva del AA del term: `26O` → 2026.
    const year = 2000 + Number(survey.term.slice(0, 2));
    if (!ANNUAL_PLAN_YEARS.has(year)) {
      throw mockApiError({
        status: 409,
        error: 'ANNUAL_PLAN_REQUIRED',
        message: `No hay planeación anual de ${year}; créala primero.`,
      });
    }

    const plan: TrimestralPlanDetail = {
      id: this.nextPlanId++,
      term: survey.term,
      status: 'BORRADOR',
      surveyId: survey.id,
      outdated: false,
      outdatedReasons: [],
      prerequisites: { surveyClosed: true, annualPlanTerminated: true },
      exportedAt: null,
      ...buildFromSurvey(survey, () => this.nextGroupId++),
    };
    this.plans.push(plan);
    return clone(plan);
  }

  regenerate(id: number): TrimestralPlanDetail {
    const plan = this.requireEditable(id);
    const survey = SEED_SURVEYS.find((s) => s.id === plan.surveyId);
    if (!survey) {
      throw mockApiError({
        status: 404,
        error: 'SURVEY_NOT_FOUND',
        message: `No existe la encuesta ${plan.surveyId}`,
      });
    }
    Object.assign(
      plan,
      buildFromSurvey(survey, () => this.nextGroupId++),
      { outdated: false, outdatedReasons: [] },
    );
    return clone(plan);
  }

  // ---- HU-59 ----

  saveGroups(id: number, request: SaveTrimestralPlanRequest): TrimestralPlanDetail {
    const plan = this.requireEditable(id);
    const previousGroups = clone(plan.groups);
    const seenStudentsByUea = new Map<number, Set<number>>();

    const groups: TrimestralGroup[] = request.groups.map((update) => {
      const uea = UEA_CATALOG_SEED.find((u) => u.id === update.ueaId);
      if (!uea) {
        throw mockApiError({ status: 404, message: `UEA ${update.ueaId} no existe` });
      }
      const previous = plan.groups.find(
        (group) => group.id === update.id && group.ueaId === update.ueaId,
      );
      const annualSettings =
        previous ??
        plan.groups.find((group) => group.ueaId === update.ueaId) ??
        seedAnnualSettings(update.ueaId);
      const seenProfessorIds = new Set<number>();
      const professors: GroupProfessor[] = update.professorIds.map((professorId) => {
        if (!seenProfessorIds.add(professorId)) {
          throw mockApiError({ status: 400, message: `Profesor ${professorId} está repetido` });
        }
        const professor = PROFESSORS_SEED.find((p) => p.id === professorId);
        const previousProfessor = previous?.professors.find(
          (assigned) => assigned.professorId === professorId,
        );
        if (!professor || (!professor.active && !previousProfessor)) {
          throw mockApiError({ status: 404, message: `Profesor ${professorId} no existe` });
        }
        // An inactive professor cannot be newly assigned, but an existing assignment keeps
        // its original snapshot so unrelated group edits remain saveable.
        if (!professor.active) return { ...previousProfessor! };
        return {
          professorId: professor.id,
          employeeNumber: professor.employeeNumber,
          professorName: `${professor.firstName} ${professor.firstLastName}`,
        };
      });
      const seenStudents = seenStudentsByUea.get(update.ueaId) ?? new Set<number>();
      for (const member of update.students) {
        if (!seenStudents.add(member.studentId)) {
          throw mockApiError({
            status: 400,
            message: `Alumno ${member.studentId} está repetido para la UEA ${update.ueaId}`,
          });
        }
      }
      seenStudentsByUea.set(update.ueaId, seenStudents);

      return {
        id: update.id ?? this.nextGroupId++,
        ueaId: uea.id,
        clave: uea.clave,
        nombre: uea.nombre,
        tipoUea: uea.tipo,
        grupo: update.grupo,
        cupo: update.cupo,
        maxGroups: annualSettings?.maxGroups ?? null,
        professors,
        schedule: update.schedule,
        // `source`/`academicTerm` are snapshots the API never accepts on write: keep the
        // previous value when the student was already there, otherwise it is a MANUAL add.
        // La nota (`obs`, col AB del Excel) sí es escribible por alumno.
        students: update.students.map((member) =>
          toGroupStudent(
            member,
            previous?.students.find((s) => s.studentId === member.studentId),
          ),
        ),
      };
    });

    for (const group of groups) {
      if (!hasRoom(group, group.cupo, 0)) {
        throw mockApiError({
          status: 400,
          error: 'GROUP_CAPACITY_EXCEEDED',
          message: `El grupo ${group.grupo ?? group.clave} rebasa su cupo`,
        });
      }
    }
    const groupsByUea = new Map<number, TrimestralGroup[]>();
    for (const group of groups) {
      groupsByUea.set(group.ueaId, [...(groupsByUea.get(group.ueaId) ?? []), group]);
    }
    for (const sameUea of groupsByUea.values()) {
      const maxGroups = sameUea[0]?.maxGroups;
      if (maxGroups && maxGroups !== '*' && sameUea.length > Number(maxGroups)) {
        throw mockApiError({
          status: 400,
          error: 'GROUP_LIMIT_REACHED',
          message: `La UEA ${sameUea[0]?.clave} rebasa el máximo de grupos`,
        });
      }
    }

    plan.groups = groups;
    plan.unassignedDemand = this.reconcileUnassigned(plan, previousGroups);
    plan.blankStudents = this.recomputeBlanks(plan);
    plan.warnings = this.recomputeWarnings(plan);
    return clone(plan);
  }

  changeStatus(id: number, request: ChangeTrimestralPlanStatusRequest): TrimestralPlanDetail {
    const plan = this.requirePlan(id);
    this.requirePrerequisites(plan);
    if (plan.status === request.status) {
      throw mockApiError({
        status: 409,
        error: 'INVALID_STATUS_TRANSITION',
        message: `El plan ya está en ${request.status}`,
      });
    }
    plan.status = request.status;
    plan.warnings = this.recomputeWarnings(plan);
    return clone(plan);
  }

  // ---- HU-60 ----

  export(id: number): Blob {
    const plan = this.requirePlan(id);
    this.requirePrerequisites(plan);
    plan.exportedAt = new Date().toISOString();
    // ponytail: el mock no arma un xlsx real; el backend lo genera con Apache POI (HU-60).
    return new Blob([`PCYTI ${plan.term} (mock stub)`], { type: 'text/plain' });
  }

  // ---- Listados reutilizados (HU-58/59) ----

  listSurveys(): SurveyResponse[] {
    const now = Date.now();
    return SEED_SURVEYS.map((survey) => ({
      id: survey.id,
      term: survey.term,
      status: survey.status,
      opensAt: new Date(now + survey.daysFromNow[0] * DAY).toISOString(),
      closesAt: new Date(now + survey.daysFromNow[1] * DAY).toISOString(),
      introMessage: null,
      responseCount: survey.responses.length,
      suggestedTerm: null,
    }));
  }

  /** Solo activos, igual que el endpoint real (`?active=true`); buscable por NEMP o nombre. */
  searchProfessors(search: string): PageResponse<ProfessorCatalogItem> {
    const term = search.trim().toLowerCase();
    const matches = PROFESSORS_SEED.filter(
      (p) =>
        p.active &&
        (!term ||
          p.employeeNumber.toLowerCase().includes(term) ||
          `${p.firstName} ${p.firstLastName} ${p.secondLastName ?? ''}`
            .toLowerCase()
            .includes(term)),
    );
    return page(clone(matches));
  }

  searchStudents(search: string): PageResponse<StudentCatalogItem> {
    const term = search.trim().toLowerCase();
    const matches = ENROLLED_STUDENTS_SEED.filter(
      (s) =>
        s.active &&
        (!term ||
          s.enrollmentId.toLowerCase().includes(term) ||
          seedFullName(s).toLowerCase().includes(term)),
    ).map(seedToCatalogItem);
    return page(matches);
  }

  /** Solo UEAs activas: un grupo nuevo no puede colgarse de una UEA dada de baja. */
  searchUeas(search: string): PageResponse<UeaCatalogItem> {
    const term = search.trim().toLowerCase();
    const matches = UEA_CATALOG_SEED.filter(
      (uea) =>
        uea.active &&
        (!term ||
          uea.clave.toLowerCase().includes(term) ||
          uea.nombre.toLowerCase().includes(term)),
    );
    return page(clone(matches));
  }

  // ---- internals ----

  /** Derived: answered BLANK and not placed in any group (HU-58 rule 8). */
  private recomputeBlanks(plan: TrimestralPlanDetail): BlankStudent[] {
    const placed = new Set(plan.groups.flatMap((g) => g.students.map((s) => s.studentId)));
    const survey = SEED_SURVEYS.find((s) => s.id === plan.surveyId);
    const blanks = survey
      ? survey.responses.filter((r) => r.mode === 'BLANK')
      : plan.blankStudents.map((b) => ({ studentId: b.studentId, academicTerm: b.academicTerm }));

    return blanks.flatMap((r) => {
      const student = findStudent(r.studentId);
      if (!student || placed.has(r.studentId)) return [];
      return [
        {
          studentId: student.id,
          enrollmentId: student.enrollmentId,
          fullName: seedFullName(student),
          academicTerm: r.academicTerm,
        },
      ];
    });
  }

  private reconcileUnassigned(
    plan: TrimestralPlanDetail,
    previousGroups: readonly TrimestralGroup[],
  ): UnassignedDemand[] {
    const assigned = new Set(
      plan.groups.flatMap((group) =>
        group.students.map((student) => `${group.ueaId}:${student.studentId}`),
      ),
    );
    const demand = plan.unassignedDemand.filter(
      (item) => !assigned.has(`${item.ueaId}:${item.studentId}`),
    );

    for (const group of previousGroups) {
      for (const student of group.students) {
        const key = `${group.ueaId}:${student.studentId}`;
        if (assigned.has(key)) continue;
        demand.push(
          toUnassigned(
            { id: group.ueaId, clave: group.clave, nombre: group.nombre },
            student,
            'MANUALLY_UNASSIGNED',
          ),
        );
      }
    }

    return [...new Map(demand.map((item) => [`${item.ueaId}:${item.studentId}`, item])).values()];
  }

  /** Warnings are recomputed on every write, never on read (HU-58 note 2). */
  private recomputeWarnings(plan: TrimestralPlanDetail): PlanWarning[] {
    // Los avisos de generación no son recalculables desde los grupos —la encuesta ya no se
    // relee— pero tampoco pueden desaparecer al guardar: la regla 7 del api-spec dice que la
    // generación nunca omite información en silencio. Se arrastran hasta regenerar.
    const warnings: PlanWarning[] = plan.warnings.filter((warning) =>
      GENERATION_WARNINGS.has(warning.code),
    );
    for (const group of plan.groups) {
      if (!hasRoom(group, group.cupo, 0)) {
        warnings.push({ code: 'CUPO_EXCEEDED', groupId: group.id });
      }
      for (const groupProfessor of group.professors) {
        const professor = PROFESSORS_SEED.find((p) => p.id === groupProfessor.professorId);
        if (professor && !professor.active) {
          warnings.push({
            code: 'PROFESSOR_INACTIVE',
            employeeNumber: professor.employeeNumber,
            groupId: group.id,
          });
        }
      }
      if (group.cupo === null) {
        warnings.push({ code: 'UEA_NO_QUOTA', clave: group.clave });
      }
    }
    return dedupeWarnings(warnings);
  }

  private toSummary(plan: TrimestralPlanDetail): TrimestralPlanSummary {
    return {
      id: plan.id,
      term: plan.term,
      status: plan.status,
      surveyId: plan.surveyId,
      outdated: plan.outdated,
      exportedAt: plan.exportedAt,
      groupCount: plan.groups.length,
      blankCount: plan.blankStudents.length,
    };
  }

  private requirePlan(id: number): TrimestralPlanDetail {
    const plan = this.plans.find((p) => p.id === id);
    if (!plan) {
      throw mockApiError({
        status: 404,
        error: 'TRIMESTRAL_PLAN_NOT_FOUND',
        message: `No existe la planeación ${id}`,
      });
    }
    return plan;
  }

  private requireEditable(id: number): TrimestralPlanDetail {
    const plan = this.requirePlan(id);
    if (plan.status !== 'BORRADOR') {
      throw mockApiError({
        status: 409,
        error: 'TRIMESTRAL_PLAN_NOT_EDITABLE',
        message: 'La planeación terminada no puede editarse; regrésala a borrador.',
      });
    }
    this.requirePrerequisites(plan);
    return plan;
  }

  private requirePrerequisites(plan: TrimestralPlanDetail): void {
    if (!plan.prerequisites.surveyClosed) {
      throw mockApiError({
        status: 409,
        error: 'SURVEY_NOT_CLOSED',
        message: 'La encuesta debe estar cerrada.',
      });
    }
    if (!plan.prerequisites.annualPlanTerminated) {
      throw mockApiError({
        status: 409,
        error: 'ANNUAL_PLAN_NOT_TERMINATED',
        message: 'La planeación anual debe estar terminada.',
      });
    }
  }
}

/**
 * HU-57/58: one group per (UEA, base letter). Students who picked the same UEA from the
 * same trimestre share a group; when the annual cupo is 1 they are split with an
 * alphabetical A/B suffix, ordered by last names.
 */
function buildFromSurvey(
  survey: SeedSurvey,
  allocateGroupId: () => number,
): Pick<TrimestralPlanDetail, 'groups' | 'unassignedDemand' | 'blankStudents' | 'warnings'> {
  const warnings: PlanWarning[] = [];
  // «Sin respuestas» incluye la encuesta que solo recibió inscripciones en blanco: en
  // ambos casos el plan se crea sin filas de UEA (HU-58).
  if (!survey.responses.some((r) => r.mode === 'ENROLL_UEAS')) {
    warnings.push({ code: 'NO_RESPONSES' });
  }

  const groups: TrimestralGroup[] = [];
  const unassignedDemand: UnassignedDemand[] = [];
  const enrolled = survey.responses
    .filter((r) => r.mode === 'ENROLL_UEAS')
    .sort((a, b) => {
      const sa = findStudent(a.studentId);
      const sb = findStudent(b.studentId);
      return sa && sb ? compareByLastNames(sa, sb) : 0;
    });

  for (const response of enrolled) {
    const student = findStudent(response.studentId);
    if (!student) continue;
    // Dado de baja después de responder: se avisa pero se conserva en el grupo; el
    // coordinador decide si lo quita en la edición (HU-58).
    if (!student.active) {
      warnings.push({ code: 'STUDENT_INACTIVE', enrollmentId: student.enrollmentId });
    }

    for (const ueaId of response.ueaIds) {
      const uea = UEA_CATALOG_SEED.find((u) => u.id === ueaId);
      if (!uea) continue;
      if (!uea.active) {
        warnings.push({ code: 'UEA_DEACTIVATED', clave: uea.clave });
      }

      const groupStudent: GroupStudent = {
        studentId: student.id,
        enrollmentId: student.enrollmentId,
        fullName: seedFullName(student),
        source: 'SURVEY',
        academicTerm: response.academicTerm,
        obs: null,
      };
      const annual = seedAnnualSettings(uea.id);
      if (!annual) {
        unassignedDemand.push(toUnassigned(uea, groupStudent, 'UEA_NOT_OFFERED'));
        continue;
      }
      const baseGroup =
        uea.tipoFormacion === 'INVESTIGACION'
          ? (baseGroupForTerm(response.academicTerm) ?? 'CO43')
          : 'CO43';

      const siblings = groups.filter(
        (group) => group.ueaId === uea.id && (group.grupo ?? '').startsWith(baseGroup),
      );
      const ueaGroups = groups.filter((group) => group.ueaId === uea.id);
      const open = siblings.find((group) => hasRoom(group, annual.cupo));
      if (open) {
        open.students.push(groupStudent);
        continue;
      }

      if (annual.maxGroups !== '*' && ueaGroups.length >= Number(annual.maxGroups)) {
        unassignedDemand.push(toUnassigned(uea, groupStudent, 'GROUP_LIMIT_REACHED'));
        continue;
      }
      // Base + A..Z = 27 distinct names. Never generate the character after Z.
      if (siblings.length >= 27) {
        unassignedDemand.push(toUnassigned(uea, groupStudent, 'GROUP_SUFFIX_LIMIT'));
        continue;
      }

      groups.push({
        id: allocateGroupId(),
        ueaId: uea.id,
        clave: uea.clave,
        nombre: uea.nombre,
        tipoUea: uea.tipo,
        grupo: groupWithSuffix(baseGroup, siblings.length),
        cupo: annual.cupo,
        maxGroups: annual.maxGroups,
        professors: [],
        schedule: emptySchedule(),
        students: [groupStudent],
      });
    }
  }

  const blankStudents: BlankStudent[] = survey.responses
    .filter((r) => r.mode === 'BLANK')
    .flatMap((r) => {
      const student = findStudent(r.studentId);
      return student
        ? [
            {
              studentId: student.id,
              enrollmentId: student.enrollmentId,
              fullName: seedFullName(student),
              academicTerm: r.academicTerm,
            },
          ]
        : [];
    });

  return {
    groups,
    unassignedDemand,
    blankStudents,
    warnings: dedupeWarnings(warnings),
  };
}

/** Snapshots (`source`, `academicTerm`) survive a save; a brand-new id is a MANUAL add. */
function toGroupStudent(member: SaveGroupStudentRequest, previous?: GroupStudent): GroupStudent {
  if (previous) return { ...previous, obs: member.obs };
  const student = findStudent(member.studentId);
  if (!student) {
    throw mockApiError({ status: 404, message: `Alumno ${member.studentId} no existe` });
  }
  if (!student.active) {
    throw mockApiError({
      status: 409,
      error: 'STUDENT_INACTIVE',
      message: `Alumno ${student.enrollmentId} está inactivo`,
    });
  }
  return {
    studentId: student.id,
    enrollmentId: student.enrollmentId,
    fullName: seedFullName(student),
    source: 'MANUAL',
    academicTerm: null,
    obs: member.obs,
  };
}

/**
 * Quota the annual plan defined for the UEA. UEA 2 is left undefined on purpose so the
 * generated plan carries a `UEA_NO_QUOTA` warning, and the research UEAs get cupo 1 so
 * the A/B suffix rule is exercised.
 */
function seedAnnualSettings(ueaId: number): { maxGroups: string; cupo: string } | null {
  if (ueaId === 2) return null;
  const uea = UEA_CATALOG_SEED.find((u) => u.id === ueaId);
  if (!uea) return null;
  return uea.tipoFormacion === 'INVESTIGACION'
    ? { maxGroups: '*', cupo: '1' }
    : { maxGroups: '2', cupo: '15' };
}

function toUnassigned(
  uea: Pick<UeaCatalogItem, 'id' | 'clave' | 'nombre'>,
  student: GroupStudent,
  reason: UnassignedDemand['reason'],
): UnassignedDemand {
  return {
    ueaId: uea.id,
    clave: uea.clave,
    nombre: uea.nombre,
    studentId: student.studentId,
    enrollmentId: student.enrollmentId,
    fullName: student.fullName,
    academicTerm: student.academicTerm,
    reason,
  };
}

/** `*` means unlimited; a null cupo never blocks (it only warns). */
function hasRoom(group: TrimestralGroup, cupo: string | null, extra = 1): boolean {
  if (cupo === null || cupo === '*') return true;
  const limit = Number(cupo);
  return Number.isNaN(limit) || group.students.length + extra <= limit;
}

function page<T>(content: T[]): PageResponse<T> {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: content.length || 1,
    number: 0,
  };
}

/** 25P already TERMINADA: exercises read-only mode, export and the HU-61 history. */
function seedFinished25P(): TrimestralPlanDetail {
  const ana = ENROLLED_STUDENTS_SEED[0]!;
  const uea = UEA_CATALOG_SEED[0]!;
  return {
    id: 2,
    term: '25P',
    status: 'TERMINADA',
    surveyId: 0,
    outdated: false,
    outdatedReasons: [],
    prerequisites: { surveyClosed: true, annualPlanTerminated: true },
    exportedAt: '2026-04-20T18:00:00Z',
    warnings: [],
    blankStudents: [],
    unassignedDemand: [],
    groups: [
      {
        id: 200,
        ueaId: uea.id,
        clave: uea.clave,
        nombre: uea.nombre,
        tipoUea: uea.tipo,
        grupo: 'CO43',
        cupo: '15',
        maxGroups: '2',
        professors: [{ professorId: 1, employeeNumber: '40001', professorName: 'Rafaela Blanco' }],
        schedule: SCHEDULE_DAYS.map((day) => ({
          day,
          start: day === 'LUN' || day === 'MIE' ? '08:30' : null,
          end: day === 'LUN' || day === 'MIE' ? '10:00' : null,
          lab: day === 'MIE',
        })),
        students: [
          {
            studentId: ana.id,
            enrollmentId: ana.enrollmentId,
            fullName: seedFullName(ana),
            source: 'SURVEY',
            academicTerm: 'I',
            obs: null,
          },
        ],
      },
    ],
  };
}

/**
 * 25I en BORRADOR con la encuesta reabierta (`outdated`) y un profesor dado de baja ya
 * asignado. Hace alcanzables dos reglas que si no quedarían muertas hasta que exista el
 * backend: el badge «Desactualizado» y el aviso `PROFESSOR_INACTIVE` al Terminar.
 */
function seedOutdated25I(): TrimestralPlanDetail {
  const bruno = ENROLLED_STUDENTS_SEED[1]!;
  const uea = UEA_CATALOG_SEED[4]!;
  return {
    id: 3,
    term: '25I',
    status: 'BORRADOR',
    surveyId: 6,
    outdated: true,
    outdatedReasons: ['SURVEY_REOPENED'],
    prerequisites: { surveyClosed: false, annualPlanTerminated: true },
    exportedAt: null,
    warnings: [{ code: 'PROFESSOR_INACTIVE', employeeNumber: '40004', groupId: 300 }],
    blankStudents: [],
    unassignedDemand: [],
    groups: [
      {
        id: 300,
        ueaId: uea.id,
        clave: uea.clave,
        nombre: uea.nombre,
        tipoUea: uea.tipo,
        grupo: 'CQ43',
        cupo: '15',
        maxGroups: '2',
        professors: [{ professorId: 4, employeeNumber: '40004', professorName: 'Ernesto Salas' }],
        schedule: emptySchedule(),
        students: [
          {
            studentId: bruno.id,
            enrollmentId: bruno.enrollmentId,
            fullName: seedFullName(bruno),
            source: 'SURVEY',
            academicTerm: 'III',
            obs: null,
          },
        ],
      },
    ],
  };
}
