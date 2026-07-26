import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import {
  DaySchedule,
  SaveGroupRequest,
  SaveTrimestralPlanRequest,
  SCHEDULE_DAYS,
  ScheduleDay,
  TrimestralGroup,
  UeaCatalogItem,
} from '../../../models';
import { QUOTA_PATTERN } from '../../../shared/utils/quota.util';

export type ScheduleFormGroup = FormGroup<{
  day: FormControl<ScheduleDay>;
  start: FormControl<string>;
  end: FormControl<string>;
  lab: FormControl<boolean>;
}>;

/** One row of the students table: membership + the per-student note (col AB del Excel). */
export type StudentFormGroup = FormGroup<{
  studentId: FormControl<number>;
  obs: FormControl<string>;
}>;

export type GroupFormGroup = FormGroup<{
  id: FormControl<number | null>;
  ueaId: FormControl<number>;
  clave: FormControl<string>;
  nombre: FormControl<string>;
  tipoUea: FormControl<string>;
  grupo: FormControl<string>;
  cupo: FormControl<string>;
  maxGroups: FormControl<string>;
  professorIds: FormControl<number[]>;
  schedule: FormArray<ScheduleFormGroup>;
  students: FormArray<StudentFormGroup>;
}>;

/** A day belongs in summaries/filters as soon as any of its schedule fields was captured. */
export function hasScheduleDayCapture(day: ScheduleFormGroup): boolean {
  return day.controls.start.value !== '' || day.controls.end.value !== '' || day.controls.lab.value;
}

export function hasScheduleCapture(schedule: FormArray<ScheduleFormGroup>): boolean {
  return schedule.controls.some(hasScheduleDayCapture);
}

/** A day is either empty or a complete, strictly increasing start/end range. */
export function startBeforeEndValidator(group: AbstractControl): ValidationErrors | null {
  const start = group.get('start')?.value as string;
  const end = group.get('end')?.value as string;
  const lab = group.get('lab')?.value as boolean;
  if (lab && (!start || !end)) return { labTimeRequired: true };
  if (!start && !end) return null;
  if (!start || !end) return { incompleteRange: true };
  return start < end ? null : { startAfterEnd: true };
}

export function buildStudentRow(
  fb: NonNullableFormBuilder,
  studentId: number,
  obs: string | null = null,
): StudentFormGroup {
  return fb.group({
    studentId: fb.control(studentId),
    obs: fb.control(obs ?? ''),
  });
}

function buildScheduleRow(
  fb: NonNullableFormBuilder,
  day: ScheduleDay,
  entry: DaySchedule | undefined,
): ScheduleFormGroup {
  return fb.group(
    {
      day: fb.control(day),
      start: fb.control(entry?.start ?? ''),
      end: fb.control(entry?.end ?? ''),
      lab: fb.control(entry?.lab ?? false),
    },
    { validators: startBeforeEndValidator },
  );
}

/**
 * Builds the editable form for one group. The `FormArray` of these is the source of
 * truth for the editor (groups are added/removed), unlike the annual grid whose rows
 * are fixed and mirror an immutable input by index.
 */
export function buildGroupFormGroup(
  fb: NonNullableFormBuilder,
  group: TrimestralGroup,
): GroupFormGroup {
  return fb.group({
    id: fb.control<number | null>(group.id),
    ueaId: fb.control(group.ueaId),
    // Catalog snapshots: kept in the form only to render them; never sent back.
    clave: fb.control(group.clave),
    nombre: fb.control(group.nombre),
    tipoUea: fb.control(group.tipoUea),
    grupo: fb.control(group.grupo ?? '', [Validators.maxLength(10)]),
    cupo: fb.control(group.cupo ?? '', [Validators.pattern(QUOTA_PATTERN)]),
    maxGroups: fb.control(group.maxGroups ?? ''),
    professorIds: fb.control(group.professors.map((professor) => professor.professorId)),
    schedule: fb.array(
      SCHEDULE_DAYS.map((day) =>
        buildScheduleRow(
          fb,
          day,
          group.schedule.find((entry) => entry.day === day),
        ),
      ),
    ),
    students: fb.array(
      group.students.map((student) => buildStudentRow(fb, student.studentId, student.obs)),
    ),
  });
}

/**
 * Grupo nuevo capturado desde cero. Nace con `id: 0`, que `buildSaveGroupsRequest`
 * traduce al `id: null` que la API espera; los snapshots salen del catálogo.
 */
export function emptyGroup(uea: UeaCatalogItem): TrimestralGroup {
  return {
    id: 0,
    ueaId: uea.id,
    clave: uea.clave,
    nombre: uea.nombre,
    tipoUea: uea.tipo,
    grupo: null,
    cupo: null,
    maxGroups: null,
    professors: [],
    schedule: SCHEDULE_DAYS.map((day) => ({ day, start: null, end: null, lab: false })),
    students: [],
  };
}

/** Empty strings become null: the API distinguishes "not set" from "". */
function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildSaveGroupsRequest(
  groups: readonly GroupFormGroup[],
): SaveTrimestralPlanRequest {
  return {
    groups: groups.map((form): SaveGroupRequest => {
      const value = form.getRawValue();
      return {
        // A group created in this session carries id 0 from `emptyGroup`; the API wants null.
        id: value.id || null,
        ueaId: value.ueaId,
        // Sin normalizar: la spec pide «sin formato forzado» por las letras «quemadas».
        grupo: orNull(value.grupo),
        cupo: orNull(value.cupo),
        professorIds: value.professorIds,
        schedule: value.schedule.map((day) => ({
          day: day.day,
          start: orNull(day.start),
          end: orNull(day.end),
          lab: day.lab,
        })),
        students: value.students.map((student) => ({
          studentId: student.studentId,
          obs: orNull(student.obs),
        })),
      };
    }),
  };
}
