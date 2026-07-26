import { SCHEDULE_DAYS, TrimestralGroup, TrimestralPlanDetail } from '../../../models';

/**
 * Una fila del formato de Sistemas Escolares. Los profesores y los alumnos de un grupo
 * se apilan en filas de continuación, igual que en el archivo entregado: la primera fila
 * del grupo lleva las columnas A..Y y las siguientes solo NEMP/PROF o matrícula/nombre.
 *
 * La columna Y (OBS del grupo) no aparece: la revisión celda por celda del 2026-07-21 la
 * quitó del contrato, y viene vacía en las 70 filas del archivo real. La nota que sí se
 * captura es la del alumno (columna AB).
 */
export interface ExcelPreviewRow {
  readonly div: string;
  readonly trim: string;
  readonly cveUea: string;
  readonly uea: string;
  readonly grupo: string;
  readonly cupo: string;
  readonly tipoUea: string;
  readonly nemp: string;
  readonly prof: string;
  /** 15 celdas: por cada día LUN..VIE, inicio, fin y la columna de salón. */
  readonly schedule: readonly string[];
  readonly studentName: string;
  readonly enrollmentId: string;
  readonly studentNote: string;
}

/** La división es constante en este programa; el backend la escribe igual. */
const DIVISION = 'CBI';

const EMPTY_SCHEDULE: readonly string[] = Array.from({ length: 15 }, () => '');

function scheduleCells(group: TrimestralGroup): string[] {
  return SCHEDULE_DAYS.flatMap((day) => {
    const entry = group.schedule.find((slot) => slot.day === day);
    return [entry?.start ?? '', entry?.end ?? '', entry?.lab ? 'LAB' : ''];
  });
}

/**
 * Aplana el plan **guardado** al formato de exportación, para poder contrastar en
 * pantalla lo que se va a entregar.
 *
 * ponytail: es una ayuda de lectura, no un segundo exportador. El archivo real lo genera
 * el backend con Apache POI y sigue siendo la fuente de verdad; no intentar sincronizar
 * esto celda por celda.
 */
export function flattenPlanForPreview(plan: TrimestralPlanDetail): ExcelPreviewRow[] {
  return plan.groups.flatMap((group) => {
    const [firstProfessor, ...coDirectors] = group.professors;
    const [firstStudent, ...restStudents] = group.students;

    const head: ExcelPreviewRow = {
      div: DIVISION,
      trim: plan.term,
      cveUea: group.clave,
      uea: group.nombre,
      grupo: group.grupo ?? '',
      cupo: group.cupo ?? '',
      tipoUea: group.tipoUea,
      nemp: firstProfessor?.employeeNumber ?? '',
      prof: firstProfessor?.professorName ?? '',
      schedule: scheduleCells(group),
      studentName: firstStudent?.fullName ?? '',
      enrollmentId: firstStudent?.enrollmentId ?? '',
      studentNote: firstStudent?.obs ?? '',
    };

    // Las continuaciones de profesores y de alumnos comparten filas mientras alcancen.
    const continuations = Math.max(coDirectors.length, restStudents.length);
    return [
      head,
      ...Array.from(
        { length: continuations },
        (_, index): ExcelPreviewRow => ({
          div: '',
          trim: '',
          cveUea: '',
          uea: '',
          grupo: '',
          cupo: '',
          tipoUea: '',
          schedule: EMPTY_SCHEDULE,
          nemp: coDirectors[index]?.employeeNumber ?? '',
          prof: coDirectors[index]?.professorName ?? '',
          studentName: restStudents[index]?.fullName ?? '',
          enrollmentId: restStudents[index]?.enrollmentId ?? '',
          studentNote: restStudents[index]?.obs ?? '',
        }),
      ),
    ];
  });
}
