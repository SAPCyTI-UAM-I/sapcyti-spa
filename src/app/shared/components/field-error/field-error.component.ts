import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Renders inline validation errors for a reactive form control.
 *
 * Usage:
 *   <app-field-error [control]="form.controls.email" field="EMAIL" />
 *
 * The component looks up i18n keys as  `COMMON.VALIDATION.{errorKey}`
 * (e.g. COMMON.VALIDATION.REQUIRED, COMMON.VALIDATION.EMAIL).
 */
@Component({
  selector: 'app-field-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    @if (control()?.invalid && (control()?.dirty || control()?.touched)) {
      @for (key of errorKeys(); track key) {
        <small class="text-brand-error mt-1 block text-xs">
          {{ 'COMMON.VALIDATION.' + key | translate }}
        </small>
      }
    }
  `,
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl | null>();

  errorKeys(): string[] {
    const errors: ValidationErrors | null | undefined = this.control()?.errors;
    if (!errors) return [];
    return Object.keys(errors).map((k) => k.toUpperCase());
  }
}
