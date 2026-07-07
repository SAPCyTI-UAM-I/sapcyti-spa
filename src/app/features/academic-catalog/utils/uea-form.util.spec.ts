import { FormBuilder } from '@angular/forms';

import {
  buildUeaFormGroup,
  toRegisterUeaRequest,
  toUpdateUeaRequest,
  UeaFormValue,
} from './uea-form.util';

const validValue: UeaFormValue = {
  clave: '2156024',
  nombre: 'Redes',
  tipo: 'OBLIGATORIA',
  modalidad: 'MIXTA',
  horasTeoria: 3,
  horasPractica: 3,
  tipoFormacion: 'BASICA',
  creditos: 9,
};

/** Same UEA but with padding, to prove the builders trim. */
const paddedValue: UeaFormValue = { ...validValue, clave: ' 2156024 ', nombre: '  Redes  ' };

describe('buildUeaFormGroup', () => {
  const fb = new FormBuilder().nonNullable;

  it('is invalid empty and valid once filled', () => {
    const form = buildUeaFormGroup(fb);
    expect(form.invalid).toBe(true);
    form.patchValue(validValue);
    expect(form.valid).toBe(true);
  });

  it('rejects a non-digit clave and a non-positive-integer creditos', () => {
    const form = buildUeaFormGroup(fb);
    form.patchValue({ ...validValue, clave: 'ABC', creditos: 0 });
    expect(form.get('clave')?.hasError('onlyDigits')).toBe(true);
    expect(form.get('creditos')?.hasError('integer')).toBe(true);
  });
});

describe('toRegisterUeaRequest / toUpdateUeaRequest', () => {
  it('trims and keeps clave only on register', () => {
    expect(toRegisterUeaRequest(paddedValue)).toEqual({
      clave: '2156024',
      nombre: 'Redes',
      tipo: 'OBLIGATORIA',
      modalidad: 'MIXTA',
      horasTeoria: 3,
      horasPractica: 3,
      tipoFormacion: 'BASICA',
      creditos: 9,
    });
  });

  it('omits clave on update (immutable)', () => {
    const update = toUpdateUeaRequest(validValue);
    expect(update).not.toHaveProperty('clave');
    expect(update.nombre).toBe('Redes');
  });
});
