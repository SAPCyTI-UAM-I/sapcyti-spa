import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { finalize } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import { FieldErrorComponent, I18nSelectComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { TOAST_LIFE } from '../../../../shared/utils/toast.util';
import { UeaService } from '../../services/uea.service';
import { CATALOG_ERROR_I18N_SCOPE } from '../../utils/catalog-error.util';
import {
  buildUeaFormGroup,
  toRegisterUeaRequest,
  UEA_FORMACION_OPTIONS,
  UEA_MODALIDAD_OPTIONS,
  UEA_TIPO_OPTIONS,
  UeaFormValue,
} from '../../utils/uea-form.util';
import { UeaError, mapUeaError } from '../../utils/uea-error.util';

@Component({
  selector: 'app-uea-registration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    Button,
    InputText,
    Message,
    I18nSelectComponent,
    FieldErrorComponent,
    DomainErrorMessagePipe,
  ],
  templateUrl: './uea-registration.component.html',
})
export class UeaRegistrationComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(UeaService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);

  readonly submitted = signal(false);
  readonly loading = signal(false);
  readonly error = signal<UeaError | null>(null);
  readonly catalogErrorScope = CATALOG_ERROR_I18N_SCOPE;

  readonly tipoOptions = UEA_TIPO_OPTIONS;
  readonly modalidadOptions = UEA_MODALIDAD_OPTIONS;
  readonly formacionOptions = UEA_FORMACION_OPTIONS;

  readonly form = buildUeaFormGroup(this.fb);

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) return;

    const request = toRegisterUeaRequest(this.form.getRawValue() as UeaFormValue);

    this.loading.set(true);
    this.service
      .registerUea(request)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant('ACADEMIC_CATALOG.UEAS.CREATE.SAVED'),
            life: TOAST_LIFE.DEFAULT,
          });
          void this.router.navigate(['/academic-catalog/ueas']);
        },
        error: (err) => this.error.set(mapUeaError(err)),
      });
  }

  cancel(): void {
    void this.router.navigate(['/academic-catalog/ueas']);
  }
}
