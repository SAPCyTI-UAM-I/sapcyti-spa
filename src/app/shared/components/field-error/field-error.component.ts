import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { minLengthRemaining, shouldShowFieldError } from '../../utils/field-error.util';

@Component({
  selector: 'app-field-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    @if (shouldShow()) {
      @for (key of errorKeys(); track key) {
        @if (key === 'MINLENGTH' && minLengthRemainingKey()) {
          <small class="text-error mt-1 block text-xs">
            {{ minLengthRemainingKey()! | translate: { remaining: remainingChars() ?? 0 } }}
          </small>
        } @else {
          <small class="text-error mt-1 block text-xs">
            {{ 'COMMON.VALIDATION.' + key | translate }}
          </small>
        }
      }
    }
  `,
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl | null>();
  readonly submitted = input(false);
  readonly minLengthRemainingKey = input<string | null>(null);

  shouldShow(): boolean {
    return shouldShowFieldError(this.control(), this.submitted());
  }

  remainingChars(): number | null {
    return minLengthRemaining(this.control());
  }

  errorKeys(): string[] {
    const errors: ValidationErrors | null | undefined = this.control()?.errors;
    if (!errors) return [];
    return Object.keys(errors).map((k) => k.toUpperCase());
  }
}
