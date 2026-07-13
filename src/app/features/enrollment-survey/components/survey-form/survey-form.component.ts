import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { SurveyResponse, SurveyStatus } from '../../../../models';
import { FieldErrorComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { TOAST_LIFE } from '../../../../shared/utils/toast.util';
import { EnrollmentSurveyService } from '../../services/enrollment-survey.service';
import { combineToDate, isoToDate, isoToTime } from '../../utils/datetime-fields.util';
import {
  ENROLLMENT_SURVEY_ERROR_I18N_SCOPE,
  EnrollmentSurveyError,
  mapEnrollmentSurveyError,
} from '../../utils/enrollment-survey-error.util';
import {
  buildSurveyFormGroup,
  suggestNextTerm,
  SurveyFormValue,
  toCreateRequest,
  toUpdateRequest,
} from '../../utils/enrollment-survey-form.util';

const SURVEY_LIST_ROUTE = '/enrollment-survey';
const DAY_MS = 24 * 60 * 60 * 1000;

/** HU-40 — create, edit or reopen a survey (same form). */
@Component({
  selector: 'app-survey-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    Button,
    Dialog,
    InputText,
    Message,
    FieldErrorComponent,
    DomainErrorMessagePipe,
  ],
  templateUrl: './survey-form.component.html',
})
export class SurveyFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(EnrollmentSurveyService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly idParam = this.route.snapshot.paramMap.get('id');
  readonly surveyId = this.idParam ? Number(this.idParam) : null;
  readonly isEdit = this.surveyId !== null;

  readonly errorScope = ENROLLMENT_SURVEY_ERROR_I18N_SCOPE;
  readonly form = buildSurveyFormGroup(this.fb);

  readonly loading = signal(this.isEdit);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly error = signal<EnrollmentSurveyError | null>(null);
  readonly status = signal<SurveyStatus | null>(null);
  private readonly responseCount = signal(0);

  // HU-40 — the lifecycle action (close / reopen / delete) lives on this edit screen.
  readonly isReopen = computed(() => this.status() === 'CERRADO');
  readonly isActive = computed(() => this.status() === 'ACTIVO');
  /** A PROGRAMADO survey without responses can be deleted. */
  readonly canDelete = computed(() => this.status() === 'PROGRAMADO' && this.responseCount() === 0);
  readonly showCloseDialog = signal(false);
  readonly closing = signal(false);
  /** Shown when a reopen is attempted with a closing date under a day from now. */
  readonly showReopenError = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly deleting = signal(false);

  /** The duplicate-term error renders inline under the term field, not as a banner. */
  readonly termError = computed(() =>
    this.error() === 'survey_already_exists_for_term' ? this.error() : null,
  );
  readonly bannerError = computed(() =>
    this.error() && this.error() !== 'survey_already_exists_for_term' ? this.error() : null,
  );

  ngOnInit(): void {
    if (this.surveyId !== null) {
      // `term` is the survey's identity — read-only on edit/reopen (only dates/message change).
      this.form.controls.term.disable();
      this.loadSurvey(this.surveyId);
    } else {
      this.prefillSuggestedTerm();
    }
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      return;
    }
    this.persist();
  }

  /** Reopen a CERRADO survey — requires a closing date at least a day from now. */
  reopen(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      return;
    }
    const closesAt = combineToDate(
      this.form.controls.closesDate.value,
      this.form.controls.closesTime.value,
    );
    if (!closesAt || closesAt.getTime() < Date.now() + DAY_MS) {
      this.showReopenError.set(true);
      return;
    }
    this.persist();
  }

  private persist(): void {
    this.submitting.set(true);
    const value = this.form.getRawValue() as SurveyFormValue;
    const request$ =
      this.surveyId !== null
        ? this.service.updateSurvey(this.surveyId, toUpdateRequest(value))
        : this.service.createSurvey(toCreateRequest(value));

    request$
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (survey) => {
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant('ENROLLMENT_SURVEY.FORM.SAVED'),
            life: TOAST_LIFE.DEFAULT,
          });
          void this.router.navigate([SURVEY_LIST_ROUTE, survey.id]);
        },
        error: (err) => this.error.set(mapEnrollmentSurveyError(err)),
      });
  }

  cancel(): void {
    if (this.surveyId !== null) {
      void this.router.navigate([SURVEY_LIST_ROUTE, this.surveyId]);
    } else {
      void this.router.navigate([SURVEY_LIST_ROUTE]);
    }
  }

  openCloseDialog(): void {
    this.error.set(null);
    this.showCloseDialog.set(true);
  }

  cancelClose(): void {
    if (this.closing()) {
      return;
    }
    this.showCloseDialog.set(false);
  }

  confirmClose(): void {
    if (this.surveyId === null) {
      return;
    }
    this.closing.set(true);
    this.error.set(null);
    this.service
      .closeSurvey(this.surveyId)
      .pipe(
        finalize(() => this.closing.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (survey) => {
          this.showCloseDialog.set(false);
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant('ENROLLMENT_SURVEY.DETAIL.CLOSED'),
            life: TOAST_LIFE.DEFAULT,
          });
          void this.router.navigate([SURVEY_LIST_ROUTE, survey.id]);
        },
        error: (err) => this.error.set(mapEnrollmentSurveyError(err)),
      });
  }

  openDeleteDialog(): void {
    this.error.set(null);
    this.showDeleteDialog.set(true);
  }

  cancelDelete(): void {
    if (this.deleting()) {
      return;
    }
    this.showDeleteDialog.set(false);
  }

  confirmDelete(): void {
    if (this.surveyId === null) {
      return;
    }
    this.deleting.set(true);
    this.error.set(null);
    this.service
      .deleteSurvey(this.surveyId)
      .pipe(
        finalize(() => this.deleting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.showDeleteDialog.set(false);
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant('ENROLLMENT_SURVEY.FORM.DELETED'),
            life: TOAST_LIFE.DEFAULT,
          });
          void this.router.navigate([SURVEY_LIST_ROUTE]);
        },
        error: (err) => {
          this.showDeleteDialog.set(false);
          this.error.set(mapEnrollmentSurveyError(err));
        },
      });
  }

  private loadSurvey(id: number): void {
    this.service
      .getSurvey(id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (survey) => this.patchForm(survey),
        error: (err) => this.error.set(mapEnrollmentSurveyError(err)),
      });
  }

  private patchForm(survey: SurveyResponse): void {
    this.status.set(survey.status);
    this.responseCount.set(survey.responseCount);
    this.form.patchValue({
      term: survey.term,
      opensDate: isoToDate(survey.opensAt),
      opensTime: isoToTime(survey.opensAt),
      closesDate: isoToDate(survey.closesAt),
      closesTime: isoToTime(survey.closesAt),
      introMessage: survey.introMessage ?? '',
    });
  }

  private prefillSuggestedTerm(): void {
    this.service
      .listSurveys()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (surveys) => {
          const suggested = suggestNextTerm(surveys[0]?.term ?? null);
          if (suggested) {
            this.form.controls.term.setValue(suggested);
          }
        },
      });
  }
}
