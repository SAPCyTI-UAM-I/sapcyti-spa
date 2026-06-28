import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { finalize } from 'rxjs';

import { ProfessorDetailResponse, ProfessorType } from '../../../../models';
import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import { FieldErrorComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { formatPersonName } from '../../../../shared/utils/person-name.util';
import { isFieldInvalid } from '../../../../shared/utils/field-error.util';
import { TOAST_LIFE } from '../../../../shared/utils/toast.util';
import { ProfessorService } from '../../services/professor.service';
import {
  CATALOG_ERROR_I18N_SCOPE,
  CatalogError,
  mapProfessorError,
} from '../../utils/catalog-error.util';
import {
  applyProfessorTypeEmployeeRules,
  buildUpdateProfessorRequest,
  PROFESSOR_TYPE_OPTIONS,
} from '../../utils/professor-form.util';

@Component({
  selector: 'app-professor-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    Button,
    Checkbox,
    Dialog,
    InputText,
    Message,
    Select,
    FieldErrorComponent,
    DomainErrorMessagePipe,
  ],
  templateUrl: './professor-edit.component.html',
})
export class ProfessorEditComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ProfessorService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly professorId = Number(this.route.snapshot.paramMap.get('professorId'));

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly deactivating = signal(false);
  readonly submitted = signal(false);
  readonly error = signal<CatalogError | null>(null);
  readonly deactivateError = signal<CatalogError | null>(null);
  readonly professor = signal<ProfessorDetailResponse | null>(null);
  readonly showDeactivateDialog = signal(false);

  readonly isFieldInvalid = isFieldInvalid;
  readonly formatPersonName = formatPersonName;
  readonly professorTypeOptions = PROFESSOR_TYPE_OPTIONS;
  readonly catalogErrorScope = CATALOG_ERROR_I18N_SCOPE;

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

    this.load();
  }

  backToDetail(): void {
    void this.router.navigate(['/academic-catalog/professors', this.professorId]);
  }

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    const request = buildUpdateProfessorRequest(this.form.getRawValue());

    this.service
      .updateProfessor(this.professorId, request)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant('ACADEMIC_CATALOG.PROFESSORS.EDIT.SAVED'),
            life: TOAST_LIFE.DEFAULT,
          });
          void this.router.navigate(['/academic-catalog/professors', this.professorId]);
        },
        error: (err) => this.error.set(mapProfessorError(err)),
      });
  }

  openDeactivateDialog(): void {
    this.deactivateError.set(null);
    this.showDeactivateDialog.set(true);
  }

  closeDeactivateDialog(): void {
    if (this.deactivating()) {
      return;
    }
    this.showDeactivateDialog.set(false);
    this.deactivateError.set(null);
  }

  confirmDeactivate(): void {
    this.deactivating.set(true);
    this.deactivateError.set(null);
    this.service
      .deactivateProfessor(this.professorId)
      .pipe(
        finalize(() => this.deactivating.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (professor) => {
          this.professor.set(professor);
          this.showDeactivateDialog.set(false);
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant('ACADEMIC_CATALOG.PROFESSORS.DEACTIVATE.SUCCESS'),
            life: TOAST_LIFE.DEFAULT,
          });
        },
        error: (err) => this.deactivateError.set(mapProfessorError(err)),
      });
  }

  private load(): void {
    if (!Number.isInteger(this.professorId)) {
      this.loading.set(false);
      this.error.set('professor_not_found');
      return;
    }

    this.loading.set(true);
    this.service
      .getProfessor(this.professorId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (professor) => {
          this.professor.set(professor);
          this.form.patchValue({
            professorType: professor.professorType,
            firstName: professor.firstName,
            firstLastName: professor.firstLastName,
            secondLastName: professor.secondLastName ?? '',
            email: professor.email,
            employeeNumber: professor.employeeNumber ?? '',
            phone: professor.phone,
            phoneExtension: professor.phoneExtension ?? '',
            commissionMember: professor.commissionMember,
            nextSabbaticalStart: professor.nextSabbaticalStart ?? '',
            nextSabbaticalEnd: professor.nextSabbaticalEnd ?? '',
          });
          applyProfessorTypeEmployeeRules(
            professor.professorType,
            this.form.controls.employeeNumber,
          );
        },
        error: (err) => this.error.set(mapProfessorError(err)),
      });
  }
}
