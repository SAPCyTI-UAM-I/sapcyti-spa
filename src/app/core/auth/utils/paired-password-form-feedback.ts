import { computed, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { startWith } from 'rxjs';

import { shouldShowFieldError } from '../../../shared/utils/field-error.util';

interface PairedPasswordValue {
  newPassword?: string;
  confirmPassword?: string;
}

export interface PairedPasswordFormFeedback {
  readonly passwordsMismatch: Signal<boolean>;
  readonly confirmFieldInvalid: Signal<boolean>;
}

export function createPairedPasswordFormFeedback(
  form: FormGroup,
  submitted: Signal<boolean>,
): PairedPasswordFormFeedback {
  const formValue = toSignal(
    form.valueChanges.pipe(startWith(form.getRawValue() as PairedPasswordValue)),
    { initialValue: form.getRawValue() as PairedPasswordValue },
  );
  const formStatus = toSignal(form.statusChanges.pipe(startWith(form.status)), {
    initialValue: form.status,
  });
  const confirmPasswordStatus = toSignal(
    form.controls['confirmPassword'].statusChanges.pipe(
      startWith(form.controls['confirmPassword'].status),
    ),
    { initialValue: form.controls['confirmPassword'].status },
  );

  const passwordsMismatch = computed(() => {
    const value = formValue();
    const newHasContent = (value.newPassword?.length ?? 0) > 0;
    const confirmHasContent = (value.confirmPassword?.length ?? 0) > 0;

    return (
      formStatus() === 'INVALID' &&
      !!form.errors?.['PASSWORDS_MISMATCH'] &&
      confirmPasswordStatus() !== 'INVALID' &&
      newHasContent &&
      (confirmHasContent || submitted())
    );
  });

  const confirmFieldInvalid = computed(
    () =>
      passwordsMismatch() || shouldShowFieldError(form.controls['confirmPassword'], submitted()),
  );

  return { passwordsMismatch, confirmFieldInvalid };
}

export function createSubmittedPasswordsMismatch(
  form: FormGroup,
  submitted: Signal<boolean>,
): Signal<boolean> {
  return computed(() => submitted() && !!form.errors?.['PASSWORDS_MISMATCH']);
}
