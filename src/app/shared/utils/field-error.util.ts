import { AbstractControl } from '@angular/forms';

export function shouldShowFieldError(
  control: AbstractControl | null | undefined,
  submitted: boolean,
): boolean {
  if (!control?.invalid) {
    return false;
  }

  return submitted || control.dirty || control.touched;
}

export function isFieldInvalid(
  control: AbstractControl | null | undefined,
  submitted: boolean,
  forceInvalid = false,
): boolean {
  return forceInvalid || shouldShowFieldError(control, submitted);
}

export function minLengthRemaining(control: AbstractControl | null | undefined): number | null {
  const error = control?.errors?.['minlength'] as
    | { requiredLength: number; actualLength: number }
    | undefined;
  if (!error) {
    return null;
  }

  return Math.max(0, error.requiredLength - error.actualLength);
}
