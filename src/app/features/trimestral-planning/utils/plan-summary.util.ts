import { GroupFormGroup, memberCount } from './group-form.util';
import { isGroupIncomplete } from './occupancy.util';

export interface PlanSummaryCounts {
  readonly groups: number;
  readonly assignedStudents: number;
  readonly unassignedStudents: number;
  readonly incompleteGroups: number;
  readonly groupsWithProblems: number;
}

/**
 * Conteos del encabezado del plan. Salen del formulario y no del plan cargado, para
 * que reflejen lo que el coordinador acaba de capturar y no lo último guardado.
 *
 * Un alumno inscrito en dos UEAs cuenta dos veces: la cifra es «inscripciones
 * colocadas», que es lo que se compara contra la demanda pendiente.
 */
export function computePlanSummary(
  groups: readonly GroupFormGroup[],
  pendingStudents: number,
  violatingIndices: ReadonlySet<number>,
): PlanSummaryCounts {
  return {
    groups: groups.length,
    assignedStudents: groups.reduce((total, group) => total + memberCount(group), 0),
    unassignedStudents: pendingStudents,
    incompleteGroups: groups.filter(isGroupIncomplete).length,
    groupsWithProblems: violatingIndices.size,
  };
}
