import type { I18nSelectOption } from '../../../shared/components';
import { GroupFormGroup, hasScheduleCapture } from './group-form.util';

export type GroupFilterState =
  | ''
  | 'WITH_STUDENTS'
  | 'WITHOUT_STUDENTS'
  | 'WITHOUT_PROFESSORS'
  | 'WITHOUT_SCHEDULE';

export interface TrimestralGroupFilters {
  readonly search: string;
  readonly ueaType: string;
  readonly state: GroupFilterState;
}

export const UEA_TYPE_FILTERS: I18nSelectOption[] = [
  { labelKey: 'TRIMESTRAL_PLANNING.FILTERS.ALL_TYPES', value: '' },
  { labelKey: 'ACADEMIC_CATALOG.UEAS.TYPES.OBLIGATORIA', value: 'OBLIGATORIA' },
  { labelKey: 'ACADEMIC_CATALOG.UEAS.TYPES.OPTATIVA', value: 'OPTATIVA' },
];

export const GROUP_STATE_FILTERS: I18nSelectOption<GroupFilterState>[] = [
  { labelKey: 'TRIMESTRAL_PLANNING.FILTERS.ALL_GROUPS', value: '' },
  { labelKey: 'TRIMESTRAL_PLANNING.FILTERS.WITH_STUDENTS', value: 'WITH_STUDENTS' },
  { labelKey: 'TRIMESTRAL_PLANNING.FILTERS.WITHOUT_STUDENTS', value: 'WITHOUT_STUDENTS' },
  { labelKey: 'TRIMESTRAL_PLANNING.FILTERS.WITHOUT_PROFESSORS', value: 'WITHOUT_PROFESSORS' },
  { labelKey: 'TRIMESTRAL_PLANNING.FILTERS.WITHOUT_SCHEDULE', value: 'WITHOUT_SCHEDULE' },
];

/** Accent-insensitive matching mirrors how coordinators scan keys and names in Excel. */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
    .trim();
}

export function matchesGroupFilters(
  group: GroupFormGroup,
  filters: TrimestralGroupFilters,
): boolean {
  const search = normalize(filters.search);
  const searchable = normalize(
    [group.controls.grupo.value, group.controls.clave.value, group.controls.nombre.value].join(' '),
  );

  return (
    (!search || searchable.includes(search)) &&
    (!filters.ueaType || group.controls.tipoUea.value === filters.ueaType) &&
    matchesState(group, filters.state)
  );
}

function matchesState(group: GroupFormGroup, state: GroupFilterState): boolean {
  switch (state) {
    case 'WITH_STUDENTS':
      return group.controls.students.length > 0;
    case 'WITHOUT_STUDENTS':
      return group.controls.students.length === 0;
    case 'WITHOUT_PROFESSORS':
      return group.controls.professorIds.value.length === 0;
    case 'WITHOUT_SCHEDULE':
      return !hasScheduleCapture(group.controls.schedule);
    default:
      return true;
  }
}
