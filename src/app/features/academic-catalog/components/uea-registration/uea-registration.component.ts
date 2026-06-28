import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { finalize } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import { RegisterUeaRequest } from '../../../../models';
import { FieldErrorComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { TOAST_LIFE } from '../../../../shared/utils/toast.util';
import { UeaService } from '../../services/uea.service';
import {
  CatalogError,
  CATALOG_ERROR_I18N_SCOPE,
  mapCatalogError,
} from '../../utils/catalog-error.util';
import type { I18nKey } from '../../../../core/i18n/i18n-keys.generated';

function onlyDigits(control: AbstractControl): ValidationErrors | null {
  return /^\d+$/.test(String(control.value)) ? null : { onlyDigits: true };
}

function integerValidator(control: AbstractControl): ValidationErrors | null {
  const v = Number(control.value);
  return Number.isInteger(v) && v > 0 ? null : { integer: true };
}

const UEA_TIPO_OPTIONS = [
  { labelKey: 'ACADEMIC_CATALOG.UEAS.TYPES.OBLIGATORIA' as I18nKey, value: 'OBLIGATORIA' },
  { labelKey: 'ACADEMIC_CATALOG.UEAS.TYPES.OPTATIVA' as I18nKey, value: 'OPTATIVA' },
];

const UEA_MODALIDAD_OPTIONS = [
  { labelKey: 'ACADEMIC_CATALOG.UEAS.MODALITY.MIXTA' as I18nKey, value: 'MIXTA' },
];

const UEA_FORMACION_OPTIONS = [
  { labelKey: 'ACADEMIC_CATALOG.UEAS.FORMATION_TYPES.BASICA' as I18nKey, value: 'BASICA' },
  {
    labelKey: 'ACADEMIC_CATALOG.UEAS.FORMATION_TYPES.COMPLEMENTARIA' as I18nKey,
    value: 'COMPLEMENTARIA',
  },
  {
    labelKey: 'ACADEMIC_CATALOG.UEAS.FORMATION_TYPES.INVESTIGACION' as I18nKey,
    value: 'INVESTIGACION',
  },
];

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
    Select,
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
  readonly error = signal<CatalogError | null>(null);
  readonly catalogErrorScope = CATALOG_ERROR_I18N_SCOPE;

  readonly tipoOptions = UEA_TIPO_OPTIONS;
  readonly modalidadOptions = UEA_MODALIDAD_OPTIONS;
  readonly formacionOptions = UEA_FORMACION_OPTIONS;

  readonly form = this.fb.group({
    clave: ['', [Validators.required, Validators.maxLength(20), onlyDigits]],
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    tipo: ['' as RegisterUeaRequest['tipo'], Validators.required],
    modalidad: ['MIXTA' as RegisterUeaRequest['modalidad']],
    horasTeoria: [0, [Validators.required, Validators.min(0)]],
    horasPractica: [0, [Validators.required, Validators.min(0)]],
    tipoFormacion: ['' as RegisterUeaRequest['tipoFormacion'], Validators.required],
    creditos: ['' as unknown as number, [Validators.required, integerValidator]],
  });

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    const request: RegisterUeaRequest = {
      clave: value.clave.trim(),
      nombre: value.nombre.trim(),
      tipo: value.tipo,
      modalidad: value.modalidad,
      horasTeoria: Number(value.horasTeoria),
      horasPractica: Number(value.horasPractica),
      tipoFormacion: value.tipoFormacion,
      creditos: Number(value.creditos),
    };

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
        error: (err) => this.error.set(mapCatalogError(err)),
      });
  }

  cancel(): void {
    void this.router.navigate(['/academic-catalog/ueas']);
  }
}
