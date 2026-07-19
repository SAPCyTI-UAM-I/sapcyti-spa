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
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { finalize } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import { SurveyResponse } from '../../../../models';
import { LoadStateComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { TrimestralPlanService } from '../../services/trimestral-plan.service';
import {
  mapTrimestralPlanError,
  TRIMESTRAL_PLAN_ERROR_I18N_SCOPE,
  TrimestralPlanError,
} from '../../utils/trimestral-plan-error.util';
import { compareTermsDesc } from '../../utils/trimestral-plan-status.util';

/**
 * HU-58 — pick the CERRADO survey to generate the plan from. The list has no
 * `?status=` endpoint, so it is filtered and sorted client-side (spec note 1).
 */
@Component({
  selector: 'app-trimestral-plan-new',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [RouterLink, TranslatePipe, Button, Message, LoadStateComponent, DomainErrorMessagePipe],
  templateUrl: './trimestral-plan-new.component.html',
})
export class TrimestralPlanNewComponent implements OnInit {
  private readonly service = inject(TrimestralPlanService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly generating = signal(false);
  readonly error = signal<TrimestralPlanError | null>(null);
  readonly selectedId = signal<number | null>(null);

  private readonly surveys = signal<SurveyResponse[]>([]);

  /** Closed surveys only, most recent term first. */
  readonly closedSurveys = computed(() =>
    this.surveys()
      .filter((survey) => survey.status === 'CERRADO')
      .sort((a, b) => compareTermsDesc(a.term, b.term)),
  );

  readonly errorScope = TRIMESTRAL_PLAN_ERROR_I18N_SCOPE;

  ngOnInit(): void {
    // Shortcut from the survey detail preselects, but never generates on its own.
    const preselected = Number(this.route.snapshot.queryParamMap.get('surveyId'));
    if (Number.isInteger(preselected) && preselected > 0) {
      this.selectedId.set(preselected);
    }
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service
      .listSurveys()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (surveys) => this.surveys.set(surveys),
        error: () => {
          this.surveys.set([]);
          this.loadError.set(true);
        },
      });
  }

  select(surveyId: number): void {
    this.selectedId.set(surveyId);
    this.error.set(null);
  }

  generate(): void {
    const surveyId = this.selectedId();
    if (surveyId === null || this.generating()) {
      return;
    }

    this.generating.set(true);
    this.error.set(null);
    this.service
      .generate({ surveyId })
      .pipe(
        finalize(() => this.generating.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (plan) => void this.router.navigate(['/trimestral-planning', plan.id]),
        error: (err) => this.error.set(mapTrimestralPlanError(err)),
      });
  }
}
