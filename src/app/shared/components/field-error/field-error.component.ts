import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { merge } from 'rxjs';

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
            {{ minLengthRemainingKey()! | translate: { remaining: remainingChars() } }}
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

  // Bumped on every value/status change of the bound control. The app runs
  // zoneless, so the derived signals below must depend on a signal that ticks
  // on form input — otherwise they would only recompute when some unrelated
  // change detection runs (submit, language switch), leaving a stale counter.
  private readonly controlRevision = signal(0);

  constructor() {
    effect((onCleanup) => {
      const control = this.control();
      if (!control) {
        return;
      }
      const subscription = merge(control.valueChanges, control.statusChanges).subscribe(() =>
        this.controlRevision.update((revision) => revision + 1),
      );
      onCleanup(() => subscription.unsubscribe());
    });
  }

  readonly shouldShow = computed(() => {
    this.controlRevision();
    return shouldShowFieldError(this.control(), this.submitted());
  });

  readonly remainingChars = computed(() => {
    this.controlRevision();
    return minLengthRemaining(this.control()) ?? 0;
  });

  readonly errorKeys = computed(() => {
    this.controlRevision();
    const errors: ValidationErrors | null | undefined = this.control()?.errors;
    return errors ? Object.keys(errors).map((key) => key.toUpperCase()) : [];
  });
}
