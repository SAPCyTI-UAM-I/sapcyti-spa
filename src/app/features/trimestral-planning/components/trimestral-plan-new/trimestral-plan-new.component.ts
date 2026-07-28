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
import { finalize, forkJoin } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import { SurveyResponse, TrimestralPlanSummary } from '../../../../models';
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
  private readonly plans = signal<TrimestralPlanSummary[]>([]);

  /** Closed surveys only, most recent term first. */
  readonly closedSurveys = computed(() =>
    this.surveys()
      .filter((survey) => survey.status === 'CERRADO')
      .sort((a, b) => compareTermsDesc(a.term, b.term)),
  );

  private readonly plannedTerms = computed(() => new Set(this.plans().map((plan) => plan.term)));

  /** Generating from one of these would 409; the list shows them as already planned. */
  hasPlan(survey: SurveyResponse): boolean {
    return this.plannedTerms().has(survey.term);
  }

  /**
   * HU-58 — al elegir una encuesta vieja teniendo una cerrada más reciente todavía sin
   * planeación, se avisa para no generar la equivocada por descuido. No bloquea.
   */
  readonly staleSelection = computed(() => {
    const selected = this.selectedId();
    if (selected === null) return null;

    const pending = this.closedSurveys().filter((survey) => !this.hasPlan(survey));
    const chosen = pending.find((survey) => survey.id === selected);
    const newest = pending[0];
    return chosen && newest && newest.id !== chosen.id ? newest.term : null;
  });

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
    // Los planes existentes marcan qué encuestas ya tienen planeación (HU-58).
    forkJoin({ surveys: this.service.listSurveys(), plans: this.service.list() })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ surveys, plans }) => {
          this.surveys.set(surveys);
          this.plans.set(plans);
          // La encuesta preseleccionada pudo reabrirse entre el atajo y esta carga: sin
          // esto quedaría un id que ningún radio muestra marcado y «Generar» habilitado.
          if (!this.closedSurveys().some((survey) => survey.id === this.selectedId())) {
            this.selectedId.set(null);
          }
        },
        error: () => {
          this.surveys.set([]);
          this.plans.set([]);
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
