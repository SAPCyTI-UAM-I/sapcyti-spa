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
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { finalize } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import {
  ACADEMIC_TERMS,
  AcademicTerm,
  StudentSurveyForm,
  SurveyAvailableUea,
  SurveyMode,
} from '../../../../models';
import {
  CatalogTagComponent,
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
    InputText,
    Message,
    Select,
    I18nSelectComponent,
    FieldErrorComponent,
    LoadStateComponent,
    ProfileFieldComponent,
    CatalogTagComponent,
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
      mode: this.fb.control<SurveyMode | null>('ENROLL_UEAS', Validators.required),
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

  /** Two-letter avatar initials from the student's full name. */
  readonly initials = computed(() =>
    (this.data()?.student.fullName ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase(),
  );

  readonly isBlank = computed(() => this.value().mode === 'BLANK');
  readonly selectedIds = computed(() => this.value().ueaIds ?? []);
  /** Read-only once the survey is no longer accepting responses. */
  readonly readonlyView = computed(() => this.data()?.survey.status !== 'ACTIVO');

  // UEA picker: search + sort over the available list, mutually exclusive with the selected list.
  readonly search = signal('');
  readonly sortField = signal<'clave' | 'nombre'>('clave');
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  private readonly allUeas = computed(() => this.data()?.availableUeas ?? []);

  /** UEAs the student picked, sorted by clave (shown in the "selected" table). */
  readonly selectedUeas = computed(() => {
    const ids = new Set(this.selectedIds());
    return this.allUeas()
      .filter((uea) => ids.has(uea.id))
      .sort((a, b) => a.clave.localeCompare(b.clave));
  });

  /** UEAs not yet picked, after search + sort (shown in the "available" table). */
  readonly availableUeas = computed(() => {
    const ids = new Set(this.selectedIds());
    const query = this.search().trim().toLowerCase();
    const field = this.sortField();
    const sign = this.sortDir() === 'asc' ? 1 : -1;
    return this.allUeas()
      .filter((uea) => !ids.has(uea.id))
      .filter(
        (uea) =>
          !query ||
          uea.clave.toLowerCase().includes(query) ||
          uea.nombre.toLowerCase().includes(query),
      )
      .sort((a, b) => a[field].localeCompare(b[field]) * sign);
  });

  readonly selectedCredits = computed(() =>
    this.selectedUeas().reduce((total, uea) => total + uea.creditos, 0),
  );

  constructor() {
    this.form.controls.mode.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((mode) => this.applyModeState(mode));
  }

  ngOnInit(): void {
    this.load();
  }

  addUea(uea: SurveyAvailableUea): void {
    const current = this.form.controls.ueaIds.value;
    if (!current.includes(uea.id)) {
      this.form.controls.ueaIds.setValue([...current, uea.id]);
    }
  }

  removeUea(uea: SurveyAvailableUea): void {
    this.form.controls.ueaIds.setValue(
      this.form.controls.ueaIds.value.filter((id) => id !== uea.id),
    );
  }

  sortBy(field: 'clave' | 'nombre'): void {
    if (this.sortField() === field) {
      this.sortDir.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }

  ariaSort(field: 'clave' | 'nombre'): 'ascending' | 'descending' | 'none' {
    if (this.sortField() !== field) return 'none';
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  sortIcon(field: 'clave' | 'nombre'): string {
    if (this.sortField() !== field) return 'pi-sort-alt';
    return this.sortDir() === 'asc' ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down';
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
      this.form.reset({ academicTerm: null, mode: 'ENROLL_UEAS', ueaIds: [] });
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
