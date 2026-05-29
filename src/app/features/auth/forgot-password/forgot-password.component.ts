import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { finalize } from 'rxjs';

import { AuthStateService } from '../../../core/auth/auth.service';
import { AuthPageLayoutComponent } from '../../../shared/components/auth-page-layout/auth-page-layout.component';

@Component({
  selector: 'app-forgot-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    RouterLink,
    AuthPageLayoutComponent,
    InputText,
    Button,
    Message,
  ],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly submitting = signal(false);
  readonly serverError = signal(false);
  readonly submitted = signal(false);

  onSubmit(): void {
    this.submitted.set(true);
    this.serverError.set(false);

    if (this.form.invalid) {
      return;
    }

    this.submitting.set(true);
    const { email } = this.form.getRawValue();

    this.auth
      .requestPasswordReset(email)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => void this.router.navigate(['/auth/forgot-password/sent']),
        error: () => this.serverError.set(true),
      });
  }

  showFieldError(): boolean {
    return this.submitted() && this.form.controls.email.invalid;
  }
}
