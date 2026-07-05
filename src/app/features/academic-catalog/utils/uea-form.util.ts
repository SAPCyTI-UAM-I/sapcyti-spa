import {
  AbstractControl,
  NonNullableFormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import {
  RegisterUeaRequest,
  UeaModalidad,
  UeaTipo,
  UeaTipoFormacion,
  UpdateUeaRequest,
} from '../../../models';
import { I18nSelectOption } from '../../../shared/components';

/** i18n-select options shared by the UEA register (HU-39) and edit (HU-47) forms. */
export const UEA_TIPO_OPTIONS: I18nSelectOption<UeaTipo>[] = [
  { labelKey: 'ACADEMIC_CATALOG.UEAS.TYPES.OBLIGATORIA', value: 'OBLIGATORIA' },
  { labelKey: 'ACADEMIC_CATALOG.UEAS.TYPES.OPTATIVA', value: 'OPTATIVA' },
];

export const UEA_MODALIDAD_OPTIONS: I18nSelectOption<UeaModalidad>[] = [
  { labelKey: 'ACADEMIC_CATALOG.UEAS.MODALITY.MIXTA', value: 'MIXTA' },
];

export const UEA_FORMACION_OPTIONS: I18nSelectOption<UeaTipoFormacion>[] = [
  { labelKey: 'ACADEMIC_CATALOG.UEAS.FORMATION_TYPES.BASICA', value: 'BASICA' },
  { labelKey: 'ACADEMIC_CATALOG.UEAS.FORMATION_TYPES.COMPLEMENTARIA', value: 'COMPLEMENTARIA' },
  { labelKey: 'ACADEMIC_CATALOG.UEAS.FORMATION_TYPES.INVESTIGACION', value: 'INVESTIGACION' },
];

export function onlyDigits(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value == null || value === '') return null; // defer to Validators.required
  return /^\d+$/.test(String(value)) ? null : { onlyDigits: true };
}

export function ueaIntegerValidator(control: AbstractControl): ValidationErrors | null {
  const value = Number(control.value);
  return Number.isInteger(value) && value > 0 ? null : { integer: true };
}

/** Raw value of the UEA form (register carries `clave`; edit keeps it read-only). */
export interface UeaFormValue {
  clave: string;
  nombre: string;
  tipo: UeaTipo;
  modalidad: UeaModalidad;
  horasTeoria: number;
  horasPractica: number;
  tipoFormacion: UeaTipoFormacion;
  creditos: number;
}

/** Single source of truth for the UEA form shape + validators (register & edit reuse it). */
export function buildUeaFormGroup(fb: NonNullableFormBuilder) {
  return fb.group({
    clave: ['', [Validators.required, Validators.maxLength(20), onlyDigits]],
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    tipo: ['' as UeaTipo, Validators.required],
    modalidad: ['MIXTA' as UeaModalidad],
    horasTeoria: [0, [Validators.required, Validators.min(0)]],
    horasPractica: [0, [Validators.required, Validators.min(0)]],
    tipoFormacion: ['' as UeaTipoFormacion, Validators.required],
    creditos: ['' as unknown as number, [Validators.required, ueaIntegerValidator]],
  });
}

export function toUpdateUeaRequest(value: UeaFormValue): UpdateUeaRequest {
  return {
    nombre: value.nombre.trim(),
    tipo: value.tipo,
    modalidad: value.modalidad,
    horasTeoria: Number(value.horasTeoria),
    horasPractica: Number(value.horasPractica),
    tipoFormacion: value.tipoFormacion,
    creditos: Number(value.creditos),
  };
}

export function toRegisterUeaRequest(value: UeaFormValue): RegisterUeaRequest {
  return { clave: value.clave.trim(), ...toUpdateUeaRequest(value) };
}
