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
import { AUTH_USE_MOCK } from '../../../core/auth/auth.config';
import { AUTH_MOCK_USERS } from '../../../core/auth/auth.mock';
import { hasAppProfile } from '../../../core/auth/role-authorization.util';
import { sanitizeReturnUrl } from '../../../core/auth/sanitize-return-url.util';
import { AuthPageLayoutComponent } from '../../../shared/components/auth-page-layout/auth-page-layout.component';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    RouterLink,
    AuthPageLayoutComponent,
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

  readonly authMockEnabled = inject(AUTH_USE_MOCK);
  readonly mockUsers = AUTH_MOCK_USERS;

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  readonly submitting = signal(false);
  readonly credentialError = signal(false);
  readonly serverError = signal(false);
  readonly submitted = signal(false);

  onClear(): void {
    this.form.reset({ email: '', password: '', rememberMe: false });
    this.credentialError.set(false);
    this.serverError.set(false);
    this.submitted.set(false);
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.credentialError.set(false);
    this.serverError.set(false);

    if (this.form.invalid) {
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

  showFieldError(controlName: 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return this.submitted() && control.invalid;
  }

  fieldInvalid(controlName: 'email' | 'password'): boolean {
    return this.showFieldError(controlName) || this.credentialError();
  }

  private handleLoginSuccess(): void {
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
      return;
    }

    this.serverError.set(true);
  }
}
