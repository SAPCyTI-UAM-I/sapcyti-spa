import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { finalize } from 'rxjs';

import { AuthStateService } from '../../../../core/auth/auth.service';
import { RegisterStudentRequest } from '../../../../models/student.model';
import { FieldErrorComponent } from '../../../../shared/components/field-error/field-error.component';
import { TemporaryPasswordDialogComponent } from '../../../../shared/components/temporary-password-dialog/temporary-password-dialog.component';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { StudentService } from '../../services/student.service';
import { CatalogError, mapCatalogError } from '../../utils/catalog-error.util';

@Component({
  selector: 'app-student-registration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    Button,
    InputText,
    Select,
    FieldErrorComponent,
    TemporaryPasswordDialogComponent,
  ],
  templateUrl: './student-registration.component.html',
})
export class StudentRegistrationComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthStateService);
  private readonly service = inject(StudentService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly step = signal(1);
  readonly submitted = signal(false);
  readonly loading = signal(false);
  readonly error = signal<CatalogError | null>(null);
  readonly generatedPassword = signal('');
  readonly showPasswordDialog = signal(false);
  readonly passwordCopied = signal(false);

  readonly programTypes = [
    { label: 'ACADEMIC_CATALOG.PROGRAM_TYPES.MAESTRIA', value: 'MAESTRIA' },
    { label: 'ACADEMIC_CATALOG.PROGRAM_TYPES.DOCTORADO', value: 'DOCTORADO' },
  ];

  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    firstLastName: ['', [Validators.required, Validators.maxLength(100)]],
    secondLastName: ['', Validators.maxLength(100)],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    nationality: ['', [Validators.required, Validators.maxLength(100)]],
    enrollmentId: ['', [Validators.required, Validators.maxLength(20)]],
    undergraduateDegree: ['', [Validators.required, Validators.maxLength(200)]],
    programType: ['', Validators.required],
    admissionDate: ['', Validators.required],
  });

  next(): void {
    this.submitted.set(true);
    const controls =
      this.step() === 1
        ? ['firstName', 'firstLastName', 'secondLastName', 'email', 'nationality']
        : ['enrollmentId', 'undergraduateDegree', 'programType', 'admissionDate'];
    if (controls.some((name) => this.form.get(name)?.invalid)) return;
    this.submitted.set(false);
    this.step.update((value) => Math.min(3, value + 1));
  }

  previous(): void {
    this.submitted.set(false);
    this.step.update((value) => Math.max(1, value - 1));
  }

  fieldInvalid(name: keyof typeof this.form.controls): boolean {
    return this.submitted() && this.form.controls[name].invalid;
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    const request: RegisterStudentRequest = {
      ...value,
      secondLastName: value.secondLastName.trim() || undefined,
      programType: value.programType as RegisterStudentRequest['programType'],
      graduateProgramId: this.auth.getCurrentUser()?.graduateProgramId ?? 1,
    };
    this.loading.set(true);
    this.service
      .registerStudent(request)
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
    void this.router.navigate(['/academic-catalog/students']);
  }

  closePasswordDialog(): void {
    this.showPasswordDialog.set(false);
    this.generatedPassword.set('');
    this.passwordCopied.set(false);
    void this.router.navigate(['/academic-catalog/students']);
  }
}
