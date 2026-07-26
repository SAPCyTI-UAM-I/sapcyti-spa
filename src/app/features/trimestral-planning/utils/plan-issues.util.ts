import { GroupFormGroup } from './group-form.util';

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
 * Reúne todo lo que bloquea el guardado en una lista legible. Los índices de violación
 * llegan calculados desde el editor: son reglas entre grupos (cupo y máximo de la
 * planeación anual), no del `FormGroup`, y ya se usan para filtrar y marcar filas.
 */
export function collectGroupIssues(
  groups: readonly GroupFormGroup[],
  capacityViolations: readonly number[],
  groupLimitViolations: readonly number[],
): GroupIssue[] {
  const issues: GroupIssue[] = [];
  const capacity = new Set(capacityViolations);
  const limits = new Set(groupLimitViolations);

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
