import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { finalize } from 'rxjs';

import { AuthStateService } from '../../../core/auth/auth.service';
import { AuthFooterComponent } from '../../../shared/components/auth-footer/auth-footer.component';
import { AuthPageLayoutComponent } from '../../../shared/components/auth-page-layout/auth-page-layout.component';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error.component';

function passwordsMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const newPassword = group.get('newPassword')?.value as string;
    const confirmPassword = group.get('confirmPassword')?.value as string;
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { PASSWORDS_MISMATCH: true };
    }
    return null;
  };
}

export type ResetErrorType = 'server' | 'invalid_token' | 'expired_token' | null;

@Component({
  selector: 'app-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    RouterLink,
    AuthFooterComponent,
    AuthPageLayoutComponent,
    FieldErrorComponent,
    Password,
    Button,
    Message,
  ],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator() },
  );

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly resetError = signal<ResetErrorType>(null);
  readonly token = signal<string | null>(null);

  /**
   * toSignal wrappers for form value and status — fires on every keystroke so
   * OnPush computed signals re-evaluate in real time without zone.js reliance.
   */
  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });
  private readonly newPasswordStatus = toSignal(this.form.controls.newPassword.statusChanges, {
    initialValue: this.form.controls.newPassword.status,
  });
  private readonly confirmPasswordStatus = toSignal(
    this.form.controls.confirmPassword.statusChanges,
    { initialValue: this.form.controls.confirmPassword.status },
  );

  /**
   * Show field-level errors as soon as the user has typed something invalid,
   * or always once the form has been submitted.
   * Passed as [submitted] to FieldErrorComponent, which reads it as a signal input.
   */
  readonly newPasswordShowError = computed(() => {
    const hasAttempt = (this.formValue().newPassword?.length ?? 0) > 0 || this.submitted();
    return this.newPasswordStatus() === 'INVALID' && hasAttempt;
  });

  /** Derives the exact field error (and remaining char count) from the value signal. */
  readonly newPasswordError = computed((): { type: 'required' | 'minlength'; remaining: number } | null => {
    if (!this.newPasswordShowError()) return null;
    const value = this.formValue().newPassword ?? '';
    if (value.length === 0) return { type: 'required', remaining: 8 };
    if (value.length < 8) return { type: 'minlength', remaining: 8 - value.length };
    return null;
  });

  readonly confirmPasswordShowError = computed(() => {
    const hasAttempt = (this.formValue().confirmPassword?.length ?? 0) > 0 || this.submitted();
    return this.confirmPasswordStatus() === 'INVALID' && hasAttempt;
  });

  /**
   * Show mismatch as soon as the user has typed in the confirm field and the
   * passwords diverge — no need to wait for a submit attempt.
   */
  readonly passwordsMismatch = computed(() => {
    const value = this.formValue();
    const newHasContent = (value.newPassword?.length ?? 0) > 0;
    const confirmHasContent = (value.confirmPassword?.length ?? 0) > 0;
    return (
      this.formStatus() === 'INVALID' &&
      !!this.form.errors?.['PASSWORDS_MISMATCH'] &&
      this.confirmPasswordStatus() !== 'INVALID' &&
      newHasContent &&
      (confirmHasContent || this.submitted())
    );
  });

  ngOnInit(): void {
    this.token.set(this.route.snapshot.queryParamMap.get('token'));
  }

  onEnter(): void {
    this.onSubmit();
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.resetError.set(null);

    const currentToken = this.token();
    if (!currentToken || this.form.invalid) {
      return;
    }

    this.submitting.set(true);
    const { newPassword } = this.form.getRawValue();

    this.auth
      .resetPassword(currentToken, newPassword)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => void this.router.navigate(['/auth/login']),
        error: (err: { status?: number; error?: { code?: string; error?: string } }) => {
          const code = err?.error?.code ?? err?.error?.error;
          if (code === 'EXPIRED_TOKEN') {
            this.resetError.set('expired_token');
          } else if (err?.status === 400 && (code === 'INVALID_TOKEN' || code === 'TOKEN_USED')) {
            this.resetError.set('invalid_token');
          } else {
            this.resetError.set('server');
          }
        },
      });
  }
}
