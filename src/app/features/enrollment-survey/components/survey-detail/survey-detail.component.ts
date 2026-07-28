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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { finalize, forkJoin } from 'rxjs';

import {
  InterestedStudent,
  SurveyResponse,
  SurveyResultsSummary,
  UeaDemandRow,
} from '../../../../models';
import { CatalogTagComponent, LoadStateComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { EnrollmentSurveyService } from '../../services/enrollment-survey.service';
import { statusTagSeverity } from '../../utils/enrollment-survey-status.util';

/** HU-40 + HU-42 — survey detail with edit access and inline results. */
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
    CatalogTagComponent,
    LoadStateComponent,
  ],
  templateUrl: './survey-detail.component.html',
})
export class SurveyDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(EnrollmentSurveyService);
  private readonly destroyRef = inject(DestroyRef);

  readonly surveyId = Number(this.route.snapshot.paramMap.get('id'));

  readonly survey = signal<SurveyResponse | null>(null);
  readonly summary = signal<SurveyResultsSummary | null>(null);
  readonly rows = signal<UeaDemandRow[]>([]);
  /** HU-42 — respondieron en blanco: cuentan como respuesta pero no generan demanda. */
  readonly blankStudents = signal<InterestedStudent[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal(false);

  readonly statusTagSeverity = statusTagSeverity;

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
      blanks: this.service.getResultsBlankStudents(this.surveyId),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ survey, summary, rows, blanks }) => {
          this.survey.set(survey);
          this.summary.set(summary);
          this.rows.set(rows);
          this.blankStudents.set(blanks);
        },
        error: () => this.loadError.set(true),
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
}
