import { GroupFormGroup, hasScheduleCapture } from './group-form.util';

export type OccupancySeverity = 'ok' | 'full' | 'over';

/** `*` es cupo abierto y un cupo vacío es «sin definir»: ninguno de los dos limita. */
function limitOf(cupo: string): number | null {
  const trimmed = cupo?.trim() ?? '';
  if (!trimmed || trimmed === '*') return null;
  const limit = Number(trimmed);
  return Number.isInteger(limit) ? limit : null;
}

/** «12/15» para leer la ocupación sin abrir el grupo; «12» cuando no hay tope. */
export function occupancyLabel(cupo: string, memberCount: number): string {
  const limit = limitOf(cupo);
  return limit === null ? String(memberCount) : `${memberCount}/${limit}`;
}

export function occupancySeverity(cupo: string, memberCount: number): OccupancySeverity {
  const limit = limitOf(cupo);
  if (limit === null) return 'ok';
  if (memberCount > limit) return 'over';
  return memberCount === limit ? 'full' : 'ok';
}

/**
 * Un grupo al que le falta algo que el formato oficial exige. No es una violación
 * (guardar sigue permitido), es lo que queda por capturar.
 */
export function isGroupIncomplete(group: GroupFormGroup): boolean {
  return (
    !group.controls.grupo.value.trim() ||
    group.controls.professorIds.value.length === 0 ||
    !hasScheduleCapture(group.controls.schedule)
  );
}
