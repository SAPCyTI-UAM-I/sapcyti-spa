import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Observable } from 'rxjs';

import { AuthStateService } from '../../../../core/auth/auth.service';
import {
  RegisterProfessorRequest,
  RegisterProfessorResponse,
} from '../../../../models/professor.model';
import { FieldErrorComponent } from '../../../../shared/components/field-error/field-error.component';
import { TemporaryPasswordDialogComponent } from '../../../../shared/components/temporary-password-dialog/temporary-password-dialog.component';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { ProfessorService } from '../../services/professor.service';
import { CatalogRegistrationBase } from '../catalog-registration.base';

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
export class ProfessorRegistrationComponent extends CatalogRegistrationBase<RegisterProfessorResponse> {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthStateService);
  private readonly service = inject(ProfessorService);

  protected override readonly listRoute = '/academic-catalog/professors';
  protected override readonly maxStep = 2;

  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    firstLastName: ['', [Validators.required, Validators.maxLength(100)]],
    secondLastName: ['', Validators.maxLength(100)],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    employeeNumber: ['', [Validators.required, Validators.maxLength(20)]],
  });

  protected override validateStep(step: number): boolean {
    return step === 1 ? this.form.valid : true;
  }

  protected override isFormValidForSubmit(): boolean {
    return this.form.valid;
  }

  protected override register(): Observable<RegisterProfessorResponse> {
    const value = this.form.getRawValue();
    const request: RegisterProfessorRequest = {
      ...value,
      secondLastName: value.secondLastName.trim() || undefined,
      graduateProgramId: this.auth.getCurrentUser()?.graduateProgramId ?? 1,
    };
    return this.service.registerProfessor(request);
  }
}
