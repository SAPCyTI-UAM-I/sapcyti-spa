import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { finalize } from 'rxjs';

import { AuthStateService } from '../../../core/auth/auth.service';
import { createPairedPasswordFormFeedback } from '../../../core/auth/utils';
import { passwordsMatchValidator } from '../../../core/auth/utils';
import { FieldErrorComponent } from '../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../shared/layout/routed-page-host';
import { isFieldInvalid } from '../../../shared/utils/field-error.util';
import { PasswordChangeService } from '../services/password-change.service';
import { mapPasswordChangeError, PasswordChangeError } from '../utils/password-change-error.util';

@Component({
  selector: 'app-password-change',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [ReactiveFormsModule, TranslatePipe, Button, Message, Password, FieldErrorComponent],
  templateUrl: './password-change.component.html',
})
export class PasswordChangeComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthStateService);
  private readonly service = inject(PasswordChangeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly targetUserId = Number(this.route.snapshot.paramMap.get('userId'));
  readonly administrative = Number.isInteger(this.targetUserId) && this.targetUserId > 0;
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly error = signal<PasswordChangeError | null>(null);
  readonly success = signal(false);

  readonly form = this.fb.group(
    {
      currentPassword: [''],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator() },
  );

  readonly titleKey = computed(() =>
    this.administrative ? 'ACCOUNT.PASSWORD.ADMIN_TITLE' : 'ACCOUNT.PASSWORD.SELF_TITLE',
  );
  readonly isFieldInvalid = isFieldInvalid;

  private readonly passwordFeedback = createPairedPasswordFormFeedback(this.form, this.submitted);
  readonly passwordsMismatch = this.passwordFeedback.passwordsMismatch;
  readonly confirmFieldInvalid = this.passwordFeedback.confirmFieldInvalid;

  constructor() {
    if (!this.administrative) {
      this.form.controls.currentPassword.addValidators(Validators.required);
    }
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    this.success.set(false);
    if (this.form.invalid) return;

    const currentUser = this.auth.getCurrentUser();
    const userId = this.administrative ? this.targetUserId : currentUser?.id;
    if (!userId) {
      void this.router.navigate(['/auth/login']);
      return;
    }

    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.service
      .changePassword(
        userId,
        {
          currentPassword: this.administrative ? undefined : value.currentPassword,
          newPassword: value.newPassword,
        },
        !this.administrative,
      )
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.handleSuccess(),
        error: (error) => this.error.set(mapPasswordChangeError(error)),
      });
  }

  cancel(): void {
    void this.router.navigateByUrl(this.administrative ? this.safeReturnUrl() : '/dashboard');
  }

  private handleSuccess(): void {
    this.success.set(true);
    if (this.administrative) {
      void this.router.navigateByUrl(this.safeReturnUrl());
      return;
    }
    this.auth
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ complete: () => void this.router.navigateByUrl('/auth/login') });
  }

  private safeReturnUrl(): string {
    const value = this.route.snapshot.queryParamMap.get('returnUrl');
    return value === '/academic-catalog/professors' ? value : '/academic-catalog/students';
  }
}
