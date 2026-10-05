import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordsMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const newPassword = group.get('newPassword')?.value as string;
    const confirmPassword = group.get('confirmPassword')?.value as string;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { PASSWORDS_MISMATCH: true };
    }

    return null;
  };
}
