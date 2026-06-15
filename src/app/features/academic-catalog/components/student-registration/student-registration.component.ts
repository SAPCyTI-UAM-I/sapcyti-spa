import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Observable } from 'rxjs';

import { AuthStateService } from '../../../../core/auth/auth.service';
import { RegisterStudentRequest, RegisterStudentResponse } from '../../../../models';
import { FieldErrorComponent } from '../../../../shared/components';
import { TemporaryPasswordDialogComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { StudentService } from '../../services/student.service';
import { CATALOG_PROGRAM_TYPE_OPTIONS } from '../../utils/catalog-filter.options';
import { CatalogRegistrationBase } from '../catalog-registration.base';

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
export class StudentRegistrationComponent extends CatalogRegistrationBase<RegisterStudentResponse> {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthStateService);
  private readonly service = inject(StudentService);

  protected override readonly listRoute = '/academic-catalog/students';
  protected override readonly maxStep = 3;

  readonly programTypes = CATALOG_PROGRAM_TYPE_OPTIONS;

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

  protected override validateStep(step: number): boolean {
    const controls =
      step === 1
        ? ['firstName', 'firstLastName', 'secondLastName', 'email', 'nationality']
        : ['enrollmentId', 'undergraduateDegree', 'programType', 'admissionDate'];
    return controls.every((name) => this.form.get(name)?.valid);
  }

  protected override isFormValidForSubmit(): boolean {
    return this.form.valid;
  }

  protected override register(): Observable<RegisterStudentResponse> {
    const value = this.form.getRawValue();
    const request: RegisterStudentRequest = {
      ...value,
      secondLastName: value.secondLastName.trim() || undefined,
      programType: value.programType as RegisterStudentRequest['programType'],
      graduateProgramId: this.auth.getCurrentUser()?.graduateProgramId ?? 1,
    };
    return this.service.registerStudent(request);
  }
}
