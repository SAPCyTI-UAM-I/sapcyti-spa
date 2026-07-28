import {
  AcademicTerm,
  DaySchedule,
  ProfessorCatalogItem,
  SCHEDULE_DAYS,
  SurveyMode,
  SurveyStatus,
  TrimestralPlanDetail,
} from '../../../models';
import {
  ENROLLED_STUDENTS_SEED,
  seedFullName,
} from '../../../shared/mocks/enrolled-students.mock-data';
import { UEA_CATALOG_SEED } from '../../../shared/mocks/uea-catalog.mock-data';

export const DAY_MS = 24 * 60 * 60 * 1000;

interface SeedResponse {
  studentId: number;
  academicTerm: AcademicTerm;
  mode: SurveyMode;
  ueaIds: number[];
}

export interface SeedSurvey {
  id: number;
  term: string;
  status: SurveyStatus;
  daysFromNow: [open: number, close: number];
  responses: SeedResponse[];
}

export const SEED_SURVEYS: SeedSurvey[] = [
  { id: 3, term: '27I', status: 'PROGRAMADO', daysFromNow: [3, 10], responses: [] },
  {
    id: 6,
    term: '25I',
    status: 'CERRADO',
    daysFromNow: [-200, -180],
    responses: [{ studentId: 2, academicTerm: 'III', mode: 'ENROLL_UEAS', ueaIds: [5] }],
  },
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
      { studentId: 5, academicTerm: 'IV', mode: 'ENROLL_UEAS', ueaIds: [1, 2, 36] },
      { studentId: 3, academicTerm: 'VI', mode: 'BLANK', ueaIds: [] },
    ],
  },
  {
    id: 5,
    term: '24O',
    status: 'CERRADO',
    daysFromNow: [-400, -380],
    responses: [{ studentId: 1, academicTerm: 'I', mode: 'ENROLL_UEAS', ueaIds: [1] }],
  },
];

export const ANNUAL_PLAN_YEARS = new Set([2025, 2026, 2027]);

interface PlanProfessor extends ProfessorCatalogItem {
  employeeNumber: string;
}

export const PROFESSORS_SEED: PlanProfessor[] = [
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

export function emptySchedule(): DaySchedule[] {
  return SCHEDULE_DAYS.map((day) => ({ day, start: null, end: null, lab: false }));
}

/** 25P already TERMINADA: exercises read-only mode, export and history. */
export function seedFinished25P(): TrimestralPlanDetail {
  const student = ENROLLED_STUDENTS_SEED[0]!;
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
            studentId: student.id,
            enrollmentId: student.enrollmentId,
            fullName: seedFullName(student),
            source: 'SURVEY',
            academicTerm: 'I',
            obs: null,
          },
        ],
      },
    ],
  };
}

/** 25I is outdated and keeps an already assigned inactive professor snapshot. */
export function seedOutdated25I(): TrimestralPlanDetail {
  const student = ENROLLED_STUDENTS_SEED[1]!;
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
            studentId: student.id,
            enrollmentId: student.enrollmentId,
            fullName: seedFullName(student),
            source: 'SURVEY',
            academicTerm: 'III',
            obs: null,
          },
        ],
      },
    ],
  };
}
