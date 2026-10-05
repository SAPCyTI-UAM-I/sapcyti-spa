import {
  GroupStudent,
  SCHEDULE_DAYS,
  TrimestralGroup,
  TrimestralPlanDetail,
  TrimestralPlanStatus,
} from '../../../models';

/**
 * Fixtures del feature. Los tres specs que tocan el editor traían cada uno su copia del
 * mismo grupo, así que un campo nuevo del contrato obligaba a arreglar tres archivos.
 *
 * Los valores por defecto son los que ya asertaban esos specs; lo que cambie va como
 * `overrides` explícito, para que se lea en el test qué es lo relevante del caso.
 */

export function groupStudent(overrides: Partial<GroupStudent> = {}): GroupStudent {
  return {
    studentId: 5,
    enrollmentId: '2024630005',
    fullName: 'Elena Torres Gil',
    source: 'SURVEY',
    academicTerm: 'IV',
    obs: null,
    ...overrides,
  };
}

export function trimestralGroup(overrides: Partial<TrimestralGroup> = {}): TrimestralGroup {
  return {
    id: 10,
    ueaId: 1,
    clave: '2156024',
    nombre: 'REDES',
    tipoUea: 'OBLIGATORIA',
    grupo: 'CO43',
    cupo: '15',
    maxGroups: '2',
    professors: [],
    // Los 5 días siempre presentes, como los devuelve la API.
    schedule: SCHEDULE_DAYS.map((day) => ({ day, start: null, end: null, lab: false })),
    students: [],
    ...overrides,
  };
}

export function trimestralPlanDetail(
  status: TrimestralPlanStatus = 'BORRADOR',
  overrides: Partial<TrimestralPlanDetail> = {},
): TrimestralPlanDetail {
  return {
    id: 1,
    term: '26I',
    status,
    surveyId: 1,
    outdated: false,
    outdatedReasons: [],
    prerequisites: { surveyClosed: true, annualPlanTerminated: true },
    exportedAt: null,
    warnings: [],
    blankStudents: [],
    unassignedDemand: [],
    groups: [],
    ...overrides,
  };
}
