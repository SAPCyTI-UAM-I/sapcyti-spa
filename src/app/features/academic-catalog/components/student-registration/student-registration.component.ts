import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { Tooltip } from 'primeng/tooltip';
import { finalize } from 'rxjs';

import { StudentRequest } from '../../../../models/student.model';
import { FieldErrorComponent } from '../../../../shared/components/field-error/field-error.component';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-student-registration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    FieldErrorComponent,
    InputText,
    Select,
    DatePicker,
    Button,
    Dialog,
    Toast,
    Tooltip,
  ],
  providers: [MessageService],
  templateUrl: './student-registration.component.html',
})
export class StudentRegistrationComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly studentService = inject(StudentService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly showPasswordDialog = signal(false);
  readonly generatedPassword = signal('');

  // Catálogo de nacionalidades para el dropdown
  readonly nationalities = [
    { label: 'Mexicana', value: 'MEXICAN' },
    { label: 'Extranjera', value: 'FOREIGN' },
  ];

  // Catálogo de tipos de programa académico
  readonly programTypes = [
    { label: 'Maestría', value: 'MASTER' },
    { label: 'Doctorado', value: 'DOCTORATE' },
  ];

  // Definición del formulario con validaciones
  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    firstLastName: ['', [Validators.required, Validators.maxLength(100)]],
    secondLastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    nationality: ['', Validators.required],
    enrollmentId: ['', [Validators.required, Validators.pattern('^[0-9]{9,10}$')]], // Matrícula UAM de 9 o 10 dígitos
    undergraduateDegree: ['', [Validators.required, Validators.maxLength(150)]],
    programType: ['', Validators.required],
    admissionDate: [null as Date | null, Validators.required],
  });

  fieldInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return this.submitted() && control.invalid;
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de validación',
        detail: 'Por favor, complete todos los campos obligatorios con el formato correcto.',
      });
      return;
    }

    this.loading.set(true);

    const formRawValues = this.form.getRawValue();
    
    // Mapeo de la fecha a formato ISO string YYYY-MM-DD
    const admissionDateString = formRawValues.admissionDate
      ? this.formatDate(formRawValues.admissionDate)
      : '';

    const request: StudentRequest = {
      firstName: formRawValues.firstName,
      firstLastName: formRawValues.firstLastName,
      secondLastName: formRawValues.secondLastName,
      email: formRawValues.email,
      nationality: formRawValues.nationality,
      enrollmentId: formRawValues.enrollmentId,
      undergraduateDegree: formRawValues.undergraduateDegree,
      programType: formRawValues.programType as 'MASTER' | 'DOCTORATE',
      admissionDate: admissionDateString,
    };

    this.studentService
      .registerStudent(request)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.generatedPassword.set(response.tempPassword ?? '');
          this.showPasswordDialog.set(true);
          this.messageService.add({
            severity: 'success',
            summary: 'Registro Exitoso',
            detail: 'El estudiante ha sido registrado correctamente.',
          });
        },
        error: (error: HttpErrorResponse) => {
          let detail = 'Ocurrió un error al registrar al alumno.';
          if (error.status === 409) {
            detail = 'El correo electrónico o la matrícula ya están registrados en el sistema.';
          }
          this.messageService.add({
            severity: 'error',
            summary: 'Error al registrar',
            detail,
          });
        },
      });
  }

  onCancel(): void {
    void this.router.navigate(['/dashboard']);
  }

  closeSuccessDialog(): void {
    this.showPasswordDialog.set(false);
    this.generatedPassword.set('');
    this.submitted.set(false);
    this.form.reset();
  }

  copyPasswordToClipboard(): void {
    const password = this.generatedPassword()?.trim();
    if (password) {
      void navigator.clipboard.writeText(password);
      this.messageService.add({
        severity: 'info',
        summary: 'Copiado',
        detail: 'La contraseña ha sido copiada al portapapeles.',
      });
    }
  }

  /**
   * Helper para formatear Date a YYYY-MM-DD local
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
