import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { finalize } from 'rxjs';

import { PasswordRecoveryService } from '../../../core/auth/password-recovery.service';
import {
  createPairedPasswordFormFeedback,
  mapResetPasswordError,
  passwordsMatchValidator,
  ResetErrorType,
} from '../../../core/auth/utils';
import {
  AuthFooterComponent,
  AuthPageLayoutComponent,
  FieldErrorComponent,
} from '../../../shared/components';
import { isFieldInvalid } from '../../../shared/utils/field-error.util';

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
  private readonly passwordRecovery = inject(PasswordRecoveryService);
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
  readonly resetError = signal<ResetErrorType | null>(null);
  readonly token = signal<string | null>(null);
  readonly isFieldInvalid = isFieldInvalid;

  private readonly passwordFeedback = createPairedPasswordFormFeedback(this.form, this.submitted);
  readonly passwordsMismatch = this.passwordFeedback.passwordsMismatch;
  readonly confirmFieldInvalid = this.passwordFeedback.confirmFieldInvalid;

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

    this.passwordRecovery
      .resetPassword(currentToken, newPassword)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => void this.router.navigate(['/auth/login']),
        error: (err) => this.resetError.set(mapResetPasswordError(err)),
      });
  }
}
