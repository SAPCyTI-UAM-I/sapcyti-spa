import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { finalize } from 'rxjs';

import { AuthStateService } from '../../../core/auth/auth.service';
import { AUTH_MOCK_USERS } from '../../../core/auth/mock/auth.mock';
import { createLoginCooldown } from '../../../core/auth/utils/login-cooldown';
import { hasAppProfile } from '../../../core/auth/utils/role-authorization.util';
import { sanitizeReturnUrl } from '../../../core/auth/utils/sanitize-return-url.util';
import { injectMockEnabled } from '../../../core/mocks/mock.config';
import { AuthFooterComponent } from '../../../shared/components/auth-footer/auth-footer.component';
import { AuthPageLayoutComponent } from '../../../shared/components/auth-page-layout/auth-page-layout.component';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error.component';
import { isFieldInvalid } from '../../../shared/utils/field-error.util';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    RouterLink,
    AuthFooterComponent,
    AuthPageLayoutComponent,
    FieldErrorComponent,
    InputText,
    Password,
    Checkbox,
    Button,
    Message,
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly authMockEnabled = injectMockEnabled('auth');
  readonly mockUsers = AUTH_MOCK_USERS;
  readonly cooldown = createLoginCooldown(this.destroyRef);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  readonly submitting = signal(false);
  readonly credentialError = signal(false);
  readonly serverError = signal(false);
  readonly submitted = signal(false);

  readonly isFieldInvalid = isFieldInvalid;

  onClear(): void {
    this.form.reset({ email: '', password: '', rememberMe: false });
    this.credentialError.set(false);
    this.serverError.set(false);
    this.submitted.set(false);
    this.cooldown.clear();
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.credentialError.set(false);
    this.serverError.set(false);

    if (this.form.invalid || this.cooldown.isActive()) {
      return;
    }

    this.submitting.set(true);
    const { email, password, rememberMe } = this.form.getRawValue();

    this.auth
      .login(email, password, rememberMe)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.handleLoginSuccess(),
        error: (error: HttpErrorResponse) => this.handleLoginError(error),
      });
  }

  private handleLoginSuccess(): void {
    this.cooldown.clear();
    const user = this.auth.getCurrentUser();
    if (!user || !hasAppProfile(user.role)) {
      void this.router.navigateByUrl('/access-denied');
      return;
    }

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    void this.router.navigateByUrl(sanitizeReturnUrl(returnUrl));
  }

  private handleLoginError(error: HttpErrorResponse): void {
    if (error.status === 401) {
      this.credentialError.set(true);
      this.cooldown.recordFailedAttempt();
      return;
    }

    this.serverError.set(true);
  }
}
