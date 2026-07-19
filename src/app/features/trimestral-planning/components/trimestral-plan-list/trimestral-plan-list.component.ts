import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { finalize } from 'rxjs';

import { TrimestralPlanSummary } from '../../../../models';
import { CatalogTagComponent, LoadStateComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { TrimestralPlanService } from '../../services/trimestral-plan.service';
import { statusTagSeverity } from '../../utils/trimestral-plan-status.util';

/** HU-58 — lists the trimestral plans (one per term) with their status. */
@Component({
  selector: 'app-trimestral-plan-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [RouterLink, TranslatePipe, Button, CatalogTagComponent, LoadStateComponent],
  templateUrl: './trimestral-plan-list.component.html',
})
export class TrimestralPlanListComponent implements OnInit {
  private readonly service = inject(TrimestralPlanService);
  private readonly destroyRef = inject(DestroyRef);

  readonly plans = signal<TrimestralPlanSummary[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal(false);

  readonly statusTagSeverity = statusTagSeverity;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service
      .list()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (plans) => this.plans.set(plans),
        error: () => {
          this.plans.set([]);
          this.loadError.set(true);
        },
      });
  }
}
