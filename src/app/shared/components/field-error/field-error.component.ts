import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-field-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    @if (shouldShow()) {
      @for (key of errorKeys(); track key) {
        <small class="text-error mt-1 block text-xs">
          {{ 'COMMON.VALIDATION.' + key | translate }}
        </small>
      }
    }
  `,
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl | null>();
  readonly submitted = input(false);

  shouldShow(): boolean {
    const control = this.control();
    if (!control?.invalid) {
      return false;
    }

    return this.submitted() || control.dirty || control.touched;
  }

  errorKeys(): string[] {
    const errors: ValidationErrors | null | undefined = this.control()?.errors;
    if (!errors) return [];
    return Object.keys(errors).map((k) => k.toUpperCase());
  }
}
