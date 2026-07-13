import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { finalize } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import {
  getApiErrorCode,
  getApiErrorMessage,
} from '../../../../core/errors/utils/parse-api-error.util';
import { UeaCatalogItem } from '../../../../models';
import { FieldErrorComponent, I18nSelectComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { TOAST_LIFE } from '../../../../shared/utils/toast.util';
import { UeaService } from '../../services/uea.service';
import { CATALOG_ERROR_I18N_SCOPE } from '../../utils/catalog-error.util';
import {
  buildUeaFormGroup,
  toUpdateUeaRequest,
  UEA_FORMACION_OPTIONS,
  UEA_MODALIDAD_OPTIONS,
  UEA_TIPO_OPTIONS,
  UeaFormValue,
} from '../../utils/uea-form.util';
import { UeaError, mapUeaError } from '../../utils/uea-error.util';

const UEAS_LIST_ROUTE = '/academic-catalog/ueas';

/** HU-47 (edit) + HU-48 (deactivate, inside this view). */
@Component({
  selector: 'app-uea-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    Button,
    Dialog,
    InputText,
    Message,
    I18nSelectComponent,
    FieldErrorComponent,
    DomainErrorMessagePipe,
  ],
  templateUrl: './uea-edit.component.html',
})
export class UeaEditComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(UeaService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ueaId = Number(this.route.snapshot.paramMap.get('ueaId'));

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly deactivating = signal(false);
  readonly reactivating = signal(false);
  readonly submitted = signal(false);
  readonly error = signal<UeaError | null>(null);
  readonly deactivateError = signal<UeaError | null>(null);
  readonly reactivateError = signal<UeaError | null>(null);
  readonly uea = signal<UeaCatalogItem | null>(null);
  readonly showDeactivateDialog = signal(false);
  /** HU-48: set with the API message (incl. the term) when the UEA is in an active survey. */
  readonly surveyConflictMessage = signal<string | null>(null);

  readonly catalogErrorScope = CATALOG_ERROR_I18N_SCOPE;
  readonly tipoOptions = UEA_TIPO_OPTIONS;
  readonly modalidadOptions = UEA_MODALIDAD_OPTIONS;
  readonly formacionOptions = UEA_FORMACION_OPTIONS;

  readonly form = buildUeaFormGroup(this.fb);

  ngOnInit(): void {
    // `clave` is immutable (HU-47) — read-only for the whole edit lifetime.
    this.form.get('clave')?.disable();
    this.load();
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      return;
    }

    this.submitting.set(true);
    const request = toUpdateUeaRequest(this.form.getRawValue() as UeaFormValue);

    this.service
      .updateUea(this.ueaId, request)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant('ACADEMIC_CATALOG.UEAS.EDIT.SAVED'),
            life: TOAST_LIFE.DEFAULT,
          });
          void this.router.navigate([UEAS_LIST_ROUTE]);
        },
        error: (err) => this.error.set(mapUeaError(err)),
      });
  }

  openDeactivateDialog(): void {
    this.deactivateError.set(null);
    this.surveyConflictMessage.set(null);
    this.showDeactivateDialog.set(true);
  }

  closeDeactivateDialog(): void {
    if (this.deactivating()) {
      return;
    }
    this.showDeactivateDialog.set(false);
    this.deactivateError.set(null);
    this.surveyConflictMessage.set(null);
  }

  confirmDeactivate(): void {
    // After acknowledging the active-survey warning, retry with confirm = true.
    const confirm = this.surveyConflictMessage() !== null;
    this.deactivating.set(true);
    this.deactivateError.set(null);
    this.service
      .deactivateUea(this.ueaId, confirm)
      .pipe(
        finalize(() => this.deactivating.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.showDeactivateDialog.set(false);
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant('ACADEMIC_CATALOG.UEAS.DEACTIVATE.SUCCESS'),
            life: TOAST_LIFE.DEFAULT,
          });
          void this.router.navigate([UEAS_LIST_ROUTE]);
        },
        error: (err) => {
          if (getApiErrorCode(err) === 'UEA_IN_ACTIVE_SURVEY') {
            // Keep the dialog open and show the term-bearing warning; next confirm forces.
            this.surveyConflictMessage.set(
              getApiErrorMessage(err) ??
                this.translate.instant('ACADEMIC_CATALOG.UEAS.DEACTIVATE.IN_ACTIVE_SURVEY'),
            );
          } else {
            this.deactivateError.set(mapUeaError(err));
          }
        },
      });
  }

  /** HU-55 — reactivate an inactive UEA (moved here from the list actions column). */
  reactivate(): void {
    this.reactivating.set(true);
    this.reactivateError.set(null);
    this.service
      .restoreUea(this.ueaId)
      .pipe(
        finalize(() => this.reactivating.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant('ACADEMIC_CATALOG.UEAS.RESTORE.SUCCESS'),
            life: TOAST_LIFE.DEFAULT,
          });
          void this.router.navigate([UEAS_LIST_ROUTE]);
        },
        error: (err) => this.reactivateError.set(mapUeaError(err)),
      });
  }

  cancel(): void {
    void this.router.navigate([UEAS_LIST_ROUTE]);
  }

  private load(): void {
    if (!Number.isInteger(this.ueaId)) {
      this.loading.set(false);
      this.error.set('reference_not_found');
      return;
    }

    this.service
      .getUea(this.ueaId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (uea) => {
          this.uea.set(uea);
          this.form.patchValue(uea);
        },
        error: (err) => this.error.set(mapUeaError(err)),
      });
  }
}
