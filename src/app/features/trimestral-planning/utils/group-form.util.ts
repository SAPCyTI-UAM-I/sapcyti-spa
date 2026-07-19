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
} from '../../../models';

/** Same pattern as `AnnualPlanEntry.GROUP_QUOTA_PATTERN`: a positive integer or `*`. */
export const CUPO_PATTERN = /^\*$|^[1-9][0-9]*$/;

export type ScheduleFormGroup = FormGroup<{
  day: FormControl<ScheduleDay>;
  start: FormControl<string>;
  end: FormControl<string>;
  lab: FormControl<boolean>;
}>;

export type GroupFormGroup = FormGroup<{
  id: FormControl<number | null>;
  ueaId: FormControl<number>;
  clave: FormControl<string>;
  nombre: FormControl<string>;
  grupo: FormControl<string>;
  cupo: FormControl<string>;
  professorId: FormControl<number | null>;
  obs: FormControl<string>;
  schedule: FormArray<ScheduleFormGroup>;
  studentIds: FormControl<number[]>;
}>;

/** A day is invalid when it has both ends and start is after end. */
export function startBeforeEndValidator(group: AbstractControl): ValidationErrors | null {
  const start = group.get('start')?.value as string;
  const end = group.get('end')?.value as string;
  if (!start || !end) return null;
  return start <= end ? null : { startAfterEnd: true };
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
    grupo: fb.control(group.grupo ?? '', [Validators.maxLength(10)]),
    cupo: fb.control(group.cupo ?? '', [Validators.pattern(CUPO_PATTERN)]),
    professorId: fb.control<number | null>(group.professorId),
    obs: fb.control(group.obs ?? ''),
    schedule: fb.array(
      SCHEDULE_DAYS.map((day) =>
        buildScheduleRow(
          fb,
          day,
          group.schedule.find((entry) => entry.day === day),
        ),
      ),
    ),
    studentIds: fb.control(group.students.map((student) => student.studentId)),
  });
}

/** An empty group the coordinator fills in from scratch (`id: null` = new). */
export function emptyGroup(ueaId: number, clave: string, nombre: string): TrimestralGroup {
  return {
    id: 0,
    ueaId,
    clave,
    nombre,
    tipoUea: '',
    grupo: null,
    cupo: null,
    professorId: null,
    employeeNumber: null,
    professorName: null,
    schedule: SCHEDULE_DAYS.map((day) => ({ day, start: null, end: null, lab: false })),
    obs: null,
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
        grupo: orNull(value.grupo)?.toUpperCase() ?? null,
        cupo: orNull(value.cupo),
        professorId: value.professorId,
        schedule: value.schedule.map((day) => ({
          day: day.day,
          start: orNull(day.start),
          end: orNull(day.end),
          lab: day.lab,
        })),
        obs: orNull(value.obs),
        studentIds: value.studentIds,
      };
    }),
  };
}
