import { DatePipe } from '@angular/common';
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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Message } from 'primeng/message';
import { finalize, forkJoin } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import {
  InterestedStudent,
  SurveyResponse,
  SurveyResultsSummary,
  UeaDemandRow,
} from '../../../../models';
import { CatalogTagComponent, LoadStateComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { TOAST_LIFE } from '../../../../shared/utils/toast.util';
import { EnrollmentSurveyService } from '../../services/enrollment-survey.service';
import {
  ENROLLMENT_SURVEY_ERROR_I18N_SCOPE,
  EnrollmentSurveyError,
  mapEnrollmentSurveyError,
} from '../../utils/enrollment-survey-error.util';
import {
  allowedActions,
  statusTagSeverity,
  SurveyAction,
} from '../../utils/enrollment-survey-status.util';

const SURVEY_LIST_ROUTE = '/enrollment-survey';

/** HU-40 + HU-42 — survey detail with status-derived actions and inline results. */
@Component({
  selector: 'app-survey-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    DatePipe,
    RouterLink,
    TranslatePipe,
    Button,
    Dialog,
    Message,
    CatalogTagComponent,
    LoadStateComponent,
    DomainErrorMessagePipe,
  ],
  templateUrl: './survey-detail.component.html',
})
export class SurveyDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(EnrollmentSurveyService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly surveyId = Number(this.route.snapshot.paramMap.get('id'));
  readonly errorScope = ENROLLMENT_SURVEY_ERROR_I18N_SCOPE;

  readonly survey = signal<SurveyResponse | null>(null);
  readonly summary = signal<SurveyResultsSummary | null>(null);
  readonly rows = signal<UeaDemandRow[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly actionError = signal<EnrollmentSurveyError | null>(null);

  /** `delete` opens a confirmation dialog; `edit` navigates away. */
  readonly pendingDelete = signal(false);
  readonly processing = signal(false);

  readonly statusTagSeverity = statusTagSeverity;

  readonly actions = computed(() => {
    const survey = this.survey();
    return survey ? allowedActions(survey.status, survey.responseCount) : [];
  });
  readonly canDelete = computed(() => this.actions().some((a) => a.action === 'delete'));

  readonly hasResponses = computed(() => (this.summary()?.respondedCount ?? 0) > 0);

  // Client-side sort by demand (annual-plan-grid pattern; no paginator).
  readonly sortDir = signal<'asc' | 'desc'>('desc');
  readonly orderedRows = computed(() => {
    const sign = this.sortDir() === 'asc' ? 1 : -1;
    return [...this.rows()].sort((a, b) => (a.totalResponses - b.totalResponses) * sign);
  });

  // Interested-students modal.
  readonly selectedUea = signal<UeaDemandRow | null>(null);
  readonly students = signal<InterestedStudent[]>([]);
  readonly studentsLoading = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    forkJoin({
      survey: this.service.getSurvey(this.surveyId),
      summary: this.service.getResultsSummary(this.surveyId),
      rows: this.service.getResultsUeas(this.surveyId),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ survey, summary, rows }) => {
          this.survey.set(survey);
          this.summary.set(summary);
          this.rows.set(rows);
        },
        error: () => this.loadError.set(true),
      });
  }

  onAction(action: SurveyAction): void {
    this.actionError.set(null);
    if (action === 'delete') {
      this.pendingDelete.set(true);
      return;
    }
    // edit (close/reopen live on the edit screen)
    void this.router.navigate([SURVEY_LIST_ROUTE, this.surveyId, 'edit']);
  }

  cancelDelete(): void {
    if (this.processing()) {
      return;
    }
    this.pendingDelete.set(false);
  }

  confirmDelete(): void {
    this.processing.set(true);
    this.actionError.set(null);
    this.service
      .deleteSurvey(this.surveyId)
      .pipe(
        finalize(() => this.processing.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.pendingDelete.set(false);
          this.toast('ENROLLMENT_SURVEY.DETAIL.DELETED');
          void this.router.navigate([SURVEY_LIST_ROUTE]);
        },
        error: (err) => this.onActionError(err),
      });
  }

  toggleSort(): void {
    this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
  }

  ariaSort(): 'ascending' | 'descending' {
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  sortIcon(): string {
    return this.sortDir() === 'asc' ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down';
  }

  openStudents(row: UeaDemandRow): void {
    this.selectedUea.set(row);
    this.students.set([]);
    this.studentsLoading.set(true);
    this.service
      .getResultsUeaStudents(this.surveyId, row.ueaId)
      .pipe(
        finalize(() => this.studentsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (students) => this.students.set(students),
        error: () => this.students.set([]),
      });
  }

  closeStudents(): void {
    this.selectedUea.set(null);
  }

  private onActionError(err: unknown): void {
    this.pendingDelete.set(false);
    this.actionError.set(mapEnrollmentSurveyError(err));
  }

  private toast(summaryKey: string): void {
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant(summaryKey),
      life: TOAST_LIFE.DEFAULT,
    });
  }
}
