import { FormBuilder, Validators } from '@angular/forms';

import { shouldShowFieldError } from './field-error.util';

describe('field-error.util', () => {
  const fb = new FormBuilder().nonNullable;

  it('shows errors after submit', () => {
    const control = fb.control('', Validators.required);
    expect(shouldShowFieldError(control, true)).toBe(true);
  });

  it('shows errors when dirty without submit', () => {
    const control = fb.control('', Validators.required);
    control.markAsDirty();
    expect(shouldShowFieldError(control, false)).toBe(true);
  });

  it('hides errors on pristine untouched control before submit', () => {
    const control = fb.control('', Validators.required);
    expect(shouldShowFieldError(control, false)).toBe(false);
  });
});
