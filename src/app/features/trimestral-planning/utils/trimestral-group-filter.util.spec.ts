import { FormBuilder } from '@angular/forms';

import { SCHEDULE_DAYS, TrimestralGroup } from '../../../models';
import { buildGroupFormGroup } from './group-form.util';
import { matchesGroupFilters, type TrimestralGroupFilters } from './trimestral-group-filter.util';

const group: TrimestralGroup = {
  id: 10,
  ueaId: 1,
  clave: '2156024',
  nombre: 'REDES Y PROTOCOLOS DE COMUNICACIONES',
  tipoUea: 'OBLIGATORIA',
  grupo: 'CO43',
  cupo: '15',
  maxGroups: '1',
  professors: [],
  schedule: SCHEDULE_DAYS.map((day) => ({ day, start: null, end: null, lab: false })),
  students: [],
};

function matches(filters: Partial<TrimestralGroupFilters>): boolean {
  return matchesGroupFilters(buildGroupFormGroup(new FormBuilder().nonNullable, group), {
    search: '',
    ueaType: '',
    state: '',
    ...filters,
  });
}

describe('trimestral-group-filter.util', () => {
  it('matches group code, UEA key and accent-insensitive UEA name', () => {
    expect(matches({ search: 'co43' })).toBe(true);
    expect(matches({ search: '2156024' })).toBe(true);
    expect(matches({ search: 'protocolos' })).toBe(true);
    expect(matches({ search: 'inteligencia' })).toBe(false);
  });

  it('combines UEA type and situation filters', () => {
    expect(matches({ ueaType: 'OBLIGATORIA', state: 'WITHOUT_STUDENTS' })).toBe(true);
    expect(matches({ ueaType: 'OPTATIVA', state: 'WITHOUT_STUDENTS' })).toBe(false);
    expect(matches({ state: 'WITH_STUDENTS' })).toBe(false);
  });
});
