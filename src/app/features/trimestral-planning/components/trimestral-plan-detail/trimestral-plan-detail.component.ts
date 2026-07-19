import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { finalize } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import { PlanWarning, TrimestralPlanDetail } from '../../../../models';
import { CatalogTagComponent, LoadStateComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { TrimestralPlanService } from '../../services/trimestral-plan.service';
import {
  mapTrimestralPlanError,
  TRIMESTRAL_PLAN_ERROR_I18N_SCOPE,
  TrimestralPlanError,
} from '../../utils/trimestral-plan-error.util';
import { statusTagSeverity } from '../../utils/trimestral-plan-status.util';

/** HU-58/59/60 — the generated plan: warnings, groups and blank students. */
@Component({
  selector: 'app-trimestral-plan-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    RouterLink,
    TranslatePipe,
    Button,
    Message,
    CatalogTagComponent,
    LoadStateComponent,
    DomainErrorMessagePipe,
  ],
  templateUrl: './trimestral-plan-detail.component.html',
})
export class TrimestralPlanDetailComponent implements OnInit {
  private readonly service = inject(TrimestralPlanService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = Number(this.route.snapshot.paramMap.get('id'));

  readonly plan = signal<TrimestralPlanDetail | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly actionError = signal<TrimestralPlanError | null>(null);

  readonly statusTagSeverity = statusTagSeverity;
  readonly errorScope = TRIMESTRAL_PLAN_ERROR_I18N_SCOPE;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service
      .get(this.id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (plan) => this.plan.set(plan),
        error: () => {
          this.plan.set(null);
          this.loadError.set(true);
        },
      });
  }

  /** Interpolation params for `TRIMESTRAL_PLANNING.WARNINGS.{code}`. */
  warningParams(warning: PlanWarning): Record<string, string> {
    return {
      clave: warning.clave ?? '',
      enrollmentId: warning.enrollmentId ?? '',
      employeeNumber: warning.employeeNumber ?? '',
    };
  }

  protected setActionError(error: unknown): void {
    this.actionError.set(mapTrimestralPlanError(error));
  }
}
