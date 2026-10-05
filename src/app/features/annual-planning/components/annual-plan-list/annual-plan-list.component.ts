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

import { AnnualPlanSummary } from '../../../../models';
import { CatalogTagComponent, LoadStateComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { AnnualPlanService } from '../../services/annual-plan.service';
import { statusTagSeverity } from '../../utils/annual-plan-status.util';

/** HU-50 — lists the annual plans (one per year) with their status. */
@Component({
  selector: 'app-annual-plan-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [RouterLink, TranslatePipe, Button, CatalogTagComponent, LoadStateComponent],
  templateUrl: './annual-plan-list.component.html',
})
export class AnnualPlanListComponent implements OnInit {
  private readonly service = inject(AnnualPlanService);
  private readonly destroyRef = inject(DestroyRef);

  readonly plans = signal<AnnualPlanSummary[]>([]);
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
