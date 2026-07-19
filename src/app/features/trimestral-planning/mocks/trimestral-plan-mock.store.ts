import { Injectable } from '@angular/core';

import { mockApiError } from '../../../core/errors/testing/mock-api-error.util';
import {
  AcademicTerm,
  BlankStudent,
  ChangeTrimestralPlanStatusRequest,
  CreateTrimestralPlanRequest,
  DaySchedule,
  GroupStudent,
  PageResponse,
  PlanWarning,
  ProfessorCatalogItem,
  SaveTrimestralPlanRequest,
  SCHEDULE_DAYS,
  StudentCatalogItem,
  SurveyMode,
  SurveyResponse,
  SurveyStatus,
  TrimestralGroup,
  TrimestralPlanDetail,
  TrimestralPlanSummary,
} from '../../../models';
import {
  ENROLLED_STUDENTS_SEED,
  EnrolledStudentSeed,
  seedFullName,
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

const SEED_SURVEYS: SeedSurvey[] = [
  { id: 3, term: '27I', status: 'PROGRAMADO', daysFromNow: [3, 10], responses: [] },
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
      { studentId: 5, academicTerm: 'IV', mode: 'ENROLL_UEAS', ueaIds: [1, 2] },
      { studentId: 3, academicTerm: 'VI', mode: 'BLANK', ueaIds: [] },
    ],
  },
];

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
      ...buildFromSurvey(SEED_SURVEYS.find((s) => s.id === 1)!, () => this.nextGroupId++),
    },
    seedFinished25P(),
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

    const plan: TrimestralPlanDetail = {
      id: this.nextPlanId++,
      term: survey.term,
      status: 'BORRADOR',
      surveyId: survey.id,
      outdated: false,
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
      { outdated: false },
    );
    return clone(plan);
  }

  // ---- HU-59 ----

  saveGroups(id: number, request: SaveTrimestralPlanRequest): TrimestralPlanDetail {
    const plan = this.requireEditable(id);

    const groups: TrimestralGroup[] = request.groups.map((update) => {
      const uea = UEA_CATALOG_SEED.find((u) => u.id === update.ueaId);
      if (!uea) {
        throw mockApiError({ status: 404, message: `UEA ${update.ueaId} no existe` });
      }
      const professor = update.professorId
        ? PROFESSORS_SEED.find((p) => p.id === update.professorId)
        : undefined;
      if (update.professorId && !professor) {
        throw mockApiError({ status: 404, message: `Profesor ${update.professorId} no existe` });
      }
      const previous = plan.groups.find((g) => g.id === update.id);

      return {
        id: update.id ?? this.nextGroupId++,
        ueaId: uea.id,
        clave: uea.clave,
        nombre: uea.nombre,
        tipoUea: uea.tipo,
        grupo: update.grupo,
        cupo: update.cupo,
        professorId: professor?.id ?? null,
        employeeNumber: professor?.employeeNumber ?? null,
        professorName: professor ? `${professor.firstName} ${professor.firstLastName}` : null,
        schedule: update.schedule,
        obs: update.obs,
        // `source`/`academicTerm` are snapshots the API never accepts on write: keep the
        // previous value when the student was already there, otherwise it is a MANUAL add.
        students: update.studentIds.map((studentId) =>
          toGroupStudent(
            studentId,
            previous?.students.find((s) => s.studentId === studentId),
          ),
        ),
      };
    });

    plan.groups = groups;
    plan.blankStudents = this.recomputeBlanks(plan);
    plan.warnings = this.recomputeWarnings(plan);
    return clone(plan);
  }

  changeStatus(id: number, request: ChangeTrimestralPlanStatusRequest): TrimestralPlanDetail {
    const plan = this.requirePlan(id);
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

  searchProfessors(search: string): PageResponse<ProfessorCatalogItem> {
    const term = search.trim().toLowerCase();
    const matches = PROFESSORS_SEED.filter(
      (p) =>
        !term ||
        p.employeeNumber.toLowerCase().includes(term) ||
        `${p.firstName} ${p.firstLastName} ${p.secondLastName ?? ''}`.toLowerCase().includes(term),
    );
    return page(clone(matches));
  }

  searchStudents(search: string): PageResponse<StudentCatalogItem> {
    const term = search.trim().toLowerCase();
    const matches = ENROLLED_STUDENTS_SEED.filter(
      (s) =>
        !term ||
        s.enrollmentId.toLowerCase().includes(term) ||
        seedFullName(s).toLowerCase().includes(term),
    ).map((s) => toCatalogItem(s));
    return page(matches);
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

  /** Warnings are recomputed on every write, never on read (HU-58 note 2). */
  private recomputeWarnings(plan: TrimestralPlanDetail): PlanWarning[] {
    const warnings: PlanWarning[] = [];
    for (const group of plan.groups) {
      if (!hasRoom(group, group.cupo, 0)) {
        warnings.push({ code: 'CUPO_EXCEEDED', groupId: group.id });
      }
      const professor = PROFESSORS_SEED.find((p) => p.id === group.professorId);
      if (professor && !professor.active) {
        warnings.push({
          code: 'PROFESSOR_INACTIVE',
          employeeNumber: professor.employeeNumber,
          groupId: group.id,
        });
      }
      if (group.cupo === null) {
        warnings.push({ code: 'UEA_NO_QUOTA', clave: group.clave });
      }
    }
    return warnings;
  }

  private toSummary(plan: TrimestralPlanDetail): TrimestralPlanSummary {
    return {
      id: plan.id,
      term: plan.term,
      status: plan.status,
      surveyId: plan.surveyId,
      outdated: plan.outdated,
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
    return plan;
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
): Pick<TrimestralPlanDetail, 'groups' | 'blankStudents' | 'warnings'> {
  const warnings: PlanWarning[] = [];
  if (survey.responses.length === 0) {
    warnings.push({ code: 'NO_RESPONSES' });
  }

  const groups: TrimestralGroup[] = [];
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
    const baseGroup = baseGroupForTerm(response.academicTerm);

    for (const ueaId of response.ueaIds) {
      const uea = UEA_CATALOG_SEED.find((u) => u.id === ueaId);
      if (!uea) continue;
      if (!uea.active) {
        warnings.push({ code: 'UEA_DEACTIVATED', clave: uea.clave });
        continue;
      }

      const cupo = seedQuotaFor(uea.id);
      if (cupo === null) {
        warnings.push({ code: 'UEA_NO_QUOTA', clave: uea.clave });
      }

      const groupStudent: GroupStudent = {
        studentId: student.id,
        enrollmentId: student.enrollmentId,
        fullName: seedFullName(student),
        source: 'SURVEY',
        academicTerm: response.academicTerm,
      };

      const siblings = groups.filter(
        (g) => g.ueaId === uea.id && baseGroup !== null && (g.grupo ?? '').startsWith(baseGroup),
      );
      const open = siblings.find((g) => hasRoom(g, cupo));
      if (open) {
        open.students.push(groupStudent);
        continue;
      }

      groups.push({
        id: allocateGroupId(),
        ueaId: uea.id,
        clave: uea.clave,
        nombre: uea.nombre,
        tipoUea: uea.tipo,
        grupo: baseGroup && groupWithSuffix(baseGroup, siblings.length),
        cupo,
        professorId: null,
        employeeNumber: null,
        professorName: null,
        schedule: emptySchedule(),
        obs: null,
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

  return { groups, blankStudents, warnings };
}

/** Snapshots (`source`, `academicTerm`) survive a save; a brand-new id is a MANUAL add. */
function toGroupStudent(studentId: number, previous?: GroupStudent): GroupStudent {
  if (previous) return { ...previous };
  const student = findStudent(studentId);
  if (!student) {
    throw mockApiError({ status: 404, message: `Alumno ${studentId} no existe` });
  }
  return {
    studentId: student.id,
    enrollmentId: student.enrollmentId,
    fullName: seedFullName(student),
    source: 'MANUAL',
    academicTerm: null,
  };
}

/**
 * Quota the annual plan defined for the UEA. UEA 2 is left undefined on purpose so the
 * generated plan carries a `UEA_NO_QUOTA` warning, and the research UEAs get cupo 1 so
 * the A/B suffix rule is exercised.
 */
function seedQuotaFor(ueaId: number): string | null {
  if (ueaId === 2) return null;
  const uea = UEA_CATALOG_SEED.find((u) => u.id === ueaId);
  return uea?.tipoFormacion === 'INVESTIGACION' ? '1' : '15';
}

/** `*` means unlimited; a null cupo never blocks (it only warns). */
function hasRoom(group: TrimestralGroup, cupo: string | null, extra = 1): boolean {
  if (cupo === null || cupo === '*') return true;
  const limit = Number(cupo);
  return Number.isNaN(limit) || group.students.length + extra <= limit;
}

function toCatalogItem(seed: EnrolledStudentSeed): StudentCatalogItem {
  return {
    id: seed.id,
    userId: 900 + seed.id,
    active: true,
    enrollmentId: seed.enrollmentId,
    email: `${seed.enrollmentId}@uam.mx`,
    graduateProgramId: 1,
    firstName: seed.firstName,
    firstLastName: seed.firstLastName,
    secondLastName: seed.secondLastName,
    nationality: 'Mexicana',
    birthDate: '1998-01-01',
    phone: '5500000000',
    undergraduateDegree: 'Computación',
    lastDegreeObtained: 'LICENCIATURA',
    programType: seed.programType,
    admissionDate: '2024-09-01',
    admissionTerm: seed.admissionTerm,
  };
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
    warnings: [],
    blankStudents: [],
    groups: [
      {
        id: 200,
        ueaId: uea.id,
        clave: uea.clave,
        nombre: uea.nombre,
        tipoUea: uea.tipo,
        grupo: 'CO43',
        cupo: '15',
        professorId: 1,
        employeeNumber: '40001',
        professorName: 'Rafaela Blanco',
        schedule: SCHEDULE_DAYS.map((day) => ({
          day,
          start: day === 'LUN' || day === 'MIE' ? '08:30' : null,
          end: day === 'LUN' || day === 'MIE' ? '10:00' : null,
          lab: day === 'MIE',
        })),
        obs: null,
        students: [
          {
            studentId: ana.id,
            enrollmentId: ana.enrollmentId,
            fullName: seedFullName(ana),
            source: 'SURVEY',
            academicTerm: 'I',
          },
        ],
      },
    ],
  };
}
