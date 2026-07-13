import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { finalize } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import { ACADEMIC_TERMS, AcademicTerm, StudentSurveyForm, SurveyMode } from '../../../../models';
import {
  FieldErrorComponent,
  I18nSelectComponent,
  I18nSelectOption,
  LoadStateComponent,
  ProfileFieldComponent,
} from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { TOAST_LIFE } from '../../../../shared/utils/toast.util';
import { EnrollmentSurveyService } from '../../services/enrollment-survey.service';
import {
  ENROLLMENT_SURVEY_ERROR_I18N_SCOPE,
  EnrollmentSurveyError,
  mapEnrollmentSurveyError,
} from '../../utils/enrollment-survey-error.util';

/** Requires at least one UEA when the student chose to enroll UEAs. */
function ueaSelectionValidator(group: AbstractControl): ValidationErrors | null {
  const mode = group.get('mode')?.value as SurveyMode | null;
  const ueaIds = (group.get('ueaIds')?.value as number[]) ?? [];
  return mode === 'ENROLL_UEAS' && ueaIds.length === 0 ? { ueaRequired: true } : null;
}

/** HU-41 — student response to the active survey. */
@Component({
  selector: 'app-survey-response',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    TranslatePipe,
    Button,
    Checkbox,
    Message,
    Select,
    I18nSelectComponent,
    FieldErrorComponent,
    LoadStateComponent,
    ProfileFieldComponent,
    DomainErrorMessagePipe,
  ],
  templateUrl: './survey-response.component.html',
})
export class SurveyResponseComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(EnrollmentSurveyService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly errorScope = ENROLLMENT_SURVEY_ERROR_I18N_SCOPE;

  readonly termOptions = ACADEMIC_TERMS.map((term) => ({ label: term, value: term }));
  readonly modeOptions: I18nSelectOption<SurveyMode>[] = [
    { labelKey: 'ENROLLMENT_SURVEY.RESPONSE.MODE_ENROLL', value: 'ENROLL_UEAS' },
    { labelKey: 'ENROLLMENT_SURVEY.RESPONSE.MODE_BLANK', value: 'BLANK' },
  ];

  readonly form = this.fb.group(
    {
      academicTerm: this.fb.control<AcademicTerm | null>(null, Validators.required),
      mode: this.fb.control<SurveyMode | null>(null, Validators.required),
      ueaIds: this.fb.control<number[]>([]),
    },
    { validators: ueaSelectionValidator },
  );

  readonly data = signal<StudentSurveyForm | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly error = signal<EnrollmentSurveyError | null>(null);

  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly isBlank = computed(() => this.value().mode === 'BLANK');
  readonly selectedIds = computed(() => this.value().ueaIds ?? []);
  /** Read-only once the survey is no longer accepting responses. */
  readonly readonlyView = computed(() => this.data()?.survey.status !== 'ACTIVO');

  constructor() {
    this.form.controls.mode.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((mode) => this.applyModeState(mode));
  }

  ngOnInit(): void {
    this.load();
  }

  isSelected(ueaId: number): boolean {
    return this.selectedIds().includes(ueaId);
  }

  toggleUea(ueaId: number): void {
    const current = this.form.controls.ueaIds.value;
    const next = current.includes(ueaId)
      ? current.filter((id) => id !== ueaId)
      : [...current, ueaId];
    this.form.controls.ueaIds.setValue(next);
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    const surveyId = this.data()?.survey.id;
    if (this.form.invalid || surveyId === undefined) {
      return;
    }

    const mode = this.form.controls.mode.value!;
    this.submitting.set(true);
    this.service
      .submitResponse(surveyId, {
        academicTerm: this.form.controls.academicTerm.value!,
        mode,
        ueaIds: mode === 'BLANK' ? [] : this.form.controls.ueaIds.value,
      })
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant('ENROLLMENT_SURVEY.RESPONSE.SAVED'),
            life: TOAST_LIFE.DEFAULT,
          });
          this.load();
        },
        error: (err) => {
          const mapped = mapEnrollmentSurveyError(err);
          this.error.set(mapped);
          // A withdrawn UEA invalidates the selection → refresh the catalog.
          if (mapped === 'uea_not_available') {
            this.load();
          }
        },
      });
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.submitted.set(false);
    this.service
      .getActiveSurvey()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (form) => {
          this.data.set(form);
          if (form) {
            this.patchFromResponse(form);
          }
        },
        error: () => this.loadError.set(true),
      });
  }

  private patchFromResponse(form: StudentSurveyForm): void {
    const response = form.myResponse;
    if (response) {
      this.form.patchValue({
        academicTerm: response.academicTerm as AcademicTerm,
        mode: response.mode,
        ueaIds: [...response.ueaIds],
      });
    } else {
      this.form.reset({ academicTerm: null, mode: null, ueaIds: [] });
    }
  }

  private applyModeState(mode: SurveyMode | null): void {
    if (mode === 'BLANK') {
      this.form.controls.ueaIds.setValue([]);
      this.form.controls.ueaIds.disable();
    } else {
      this.form.controls.ueaIds.enable();
    }
  }
}
