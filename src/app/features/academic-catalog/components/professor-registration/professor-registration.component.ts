import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { Observable } from 'rxjs';

import { AuthStateService } from '../../../../core/auth/auth.service';
import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import {
  ProfessorType,
  RegisterProfessorRequest,
  RegisterProfessorResponse,
} from '../../../../models';
import { FieldErrorComponent, I18nSelectComponent } from '../../../../shared/components';
import { TemporaryPasswordDialogComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { ProfessorService } from '../../services/professor.service';
import { CatalogRegistrationBase } from '../catalog-registration.base';
import {
  applyProfessorTypeEmployeeRules,
  buildRegisterProfessorRequest,
  PROFESSOR_TYPE_OPTIONS,
} from '../../utils/professor-form.util';

@Component({
  selector: 'app-professor-registration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    Button,
    Checkbox,
    InputText,
    I18nSelectComponent,
    FieldErrorComponent,
    TemporaryPasswordDialogComponent,
    DomainErrorMessagePipe,
  ],
  templateUrl: './professor-registration.component.html',
})
export class ProfessorRegistrationComponent
  extends CatalogRegistrationBase<RegisterProfessorResponse>
  implements OnInit
{
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthStateService);
  private readonly service = inject(ProfessorService);

  protected override readonly listRoute = '/academic-catalog/professors';
  protected override readonly maxStep = 2;

  readonly professorTypeOptions = PROFESSOR_TYPE_OPTIONS;

  readonly form = this.fb.group({
    professorType: ['INTERNO' as ProfessorType, Validators.required],
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    firstLastName: ['', [Validators.required, Validators.maxLength(100)]],
    secondLastName: ['', Validators.maxLength(100)],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    employeeNumber: ['', [Validators.required, Validators.maxLength(20)]],
    phone: ['', [Validators.required, Validators.maxLength(20)]],
    phoneExtension: ['', Validators.maxLength(10)],
    commissionMember: [false],
    nextSabbaticalStart: [''],
    nextSabbaticalEnd: [''],
  });

  ngOnInit(): void {
    this.form.controls.professorType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((professorType) => {
        applyProfessorTypeEmployeeRules(professorType, this.form.controls.employeeNumber);
      });
  }

  protected override validateStep(step: number): boolean {
    return step === 1 ? this.form.valid : true;
  }

  protected override isFormValidForSubmit(): boolean {
    return this.form.valid;
  }

  protected override register(): Observable<RegisterProfessorResponse> {
    const request: RegisterProfessorRequest = buildRegisterProfessorRequest({
      ...this.form.getRawValue(),
      graduateProgramId: this.auth.getCurrentUser()?.graduateProgramId ?? 1,
    });
    return this.service.registerProfessor(request);
  }
}
