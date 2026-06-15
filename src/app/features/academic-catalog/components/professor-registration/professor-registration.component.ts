import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { finalize } from 'rxjs';

import { AuthStateService } from '../../../../core/auth/auth.service';
import { RegisterProfessorRequest } from '../../../../models/professor.model';
import { FieldErrorComponent } from '../../../../shared/components/field-error/field-error.component';
import { TemporaryPasswordDialogComponent } from '../../../../shared/components/temporary-password-dialog/temporary-password-dialog.component';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { ProfessorService } from '../../services/professor.service';
import { CatalogError, mapCatalogError } from '../../utils/catalog-error.util';

@Component({
  selector: 'app-professor-registration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    Button,
    InputText,
    FieldErrorComponent,
    TemporaryPasswordDialogComponent,
  ],
  templateUrl: './professor-registration.component.html',
})
export class ProfessorRegistrationComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthStateService);
  private readonly service = inject(ProfessorService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly step = signal(1);
  readonly submitted = signal(false);
  readonly loading = signal(false);
  readonly error = signal<CatalogError | null>(null);
  readonly generatedPassword = signal('');
  readonly showPasswordDialog = signal(false);
  readonly passwordCopied = signal(false);

  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    firstLastName: ['', [Validators.required, Validators.maxLength(100)]],
    secondLastName: ['', Validators.maxLength(100)],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    employeeNumber: ['', [Validators.required, Validators.maxLength(20)]],
  });

  next(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.submitted.set(false);
    this.step.set(2);
  }

  previous(): void {
    this.submitted.set(false);
    this.step.set(1);
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const request: RegisterProfessorRequest = {
      ...value,
      secondLastName: value.secondLastName.trim() || undefined,
      graduateProgramId: this.auth.getCurrentUser()?.graduateProgramId ?? 1,
    };
    this.loading.set(true);
    this.service
      .registerProfessor(request)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.generatedPassword.set(response.generatedPassword);
          this.showPasswordDialog.set(true);
        },
        error: (error) => this.error.set(mapCatalogError(error)),
      });
  }

  cancel(): void {
    void this.router.navigate(['/academic-catalog/professors']);
  }

  closePasswordDialog(): void {
    this.showPasswordDialog.set(false);
    this.generatedPassword.set('');
    this.passwordCopied.set(false);
    void this.router.navigate(['/academic-catalog/professors']);
  }
}
