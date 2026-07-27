import { GroupFormGroup } from './group-form.util';
import { quotaLimit } from './occupancy.util';

/**
 * Un problema concreto que impide guardar, ya localizado en su grupo. Se guarda la clave
 * i18n y los datos crudos, no la frase: traducir es de la plantilla, y así el panel
 * cambia de idioma sin recalcular nada.
 */
export interface GroupIssue {
  /** Índice en el `FormArray`, para poder llevar el foco a la fila. */
  readonly index: number;
  readonly clave: string;
  readonly grupo: string;
  readonly key: string;
  /** Día al que pertenece el problema; vacío si es del grupo entero. */
  readonly dayKey: string;
  readonly params: Readonly<Record<string, string | number>>;
}

const SCOPE = 'TRIMESTRAL_PLANNING.ISSUES.';
const NO_PARAMS: Readonly<Record<string, string | number>> = {};

/**
 * Grupos con más alumnos que el cupo autorizado. Es una regla del plan y no del
 * `FormGroup`: el cupo lo fija la planeación anual y el editor no lo deja teclear.
 */
export function overCapacityIndices(groups: readonly GroupFormGroup[]): number[] {
  return groups.flatMap((group, index) => {
    const limit = quotaLimit(group.controls.cupo.value);
    return limit !== null && group.controls.students.length > limit ? [index] : [];
  });
}

/** Grupos que rebasan el número de grupos que la planeación anual abrió para su UEA. */
export function overGroupLimitIndices(groups: readonly GroupFormGroup[]): number[] {
  const counts = new Map<number, number>();
  for (const group of groups) {
    counts.set(group.controls.ueaId.value, (counts.get(group.controls.ueaId.value) ?? 0) + 1);
  }
  return groups.flatMap((group, index) => {
    const limit = quotaLimit(group.controls.maxGroups.value);
    return limit !== null && (counts.get(group.controls.ueaId.value) ?? 0) > limit ? [index] : [];
  });
}

/**
 * Reúne todo lo que bloquea el guardado en una lista legible: los errores del formulario y
 * las dos reglas que dependen del resto de los grupos. Las calcula aquí en vez de
 * recibirlas para que la lista no pueda quedar incompleta por un llamador olvidadizo.
 */
export function collectGroupIssues(groups: readonly GroupFormGroup[]): GroupIssue[] {
  const issues: GroupIssue[] = [];
  const capacity = new Set(overCapacityIndices(groups));
  const limits = new Set(overGroupLimitIndices(groups));

  groups.forEach((group, index) => {
    const at = (key: string, dayKey = '', params = NO_PARAMS): GroupIssue => ({
      index,
      clave: group.controls.clave.value,
      grupo: group.controls.grupo.value,
      key: SCOPE + key,
      dayKey,
      params,
    });

    if (group.controls.grupo.errors?.['maxlength']) {
      issues.push(at('GRUPO_TOO_LONG', '', { max: 10 }));
    }
    if (group.controls.cupo.errors?.['pattern']) {
      issues.push(at('CUPO_FORMAT', '', { cupo: group.controls.cupo.value }));
    }
    if (capacity.has(index)) {
      issues.push(
        at('OVER_CAPACITY', '', {
          students: group.controls.students.length,
          cupo: group.controls.cupo.value,
        }),
      );
    }
    if (limits.has(index)) {
      issues.push(at('GROUP_LIMIT', '', { max: group.controls.maxGroups.value }));
    }

    for (const day of group.controls.schedule.controls) {
      const dayKey = 'TRIMESTRAL_PLANNING.DAYS.' + day.controls.day.value;
      const start = day.controls.start.value;
      const end = day.controls.end.value;

      // El formato se reporta por control: una hora ilegible no es un rango inválido.
      for (const field of ['start', 'end'] as const) {
        if (day.controls[field].errors?.['timeFormat']) {
          issues.push(at('TIME_FORMAT', dayKey, { value: day.controls[field].value }));
        }
      }
      if (day.errors?.['labTimeRequired']) {
        issues.push(at('LAB_TIME_REQUIRED', dayKey));
      }
      if (day.errors?.['incompleteRange']) {
        issues.push(at(start ? 'MISSING_END' : 'MISSING_START', dayKey, { start, end }));
      }
      if (day.errors?.['startAfterEnd']) {
        issues.push(at('START_AFTER_END', dayKey, { start, end }));
      }
    }
  });

  return issues;
}
