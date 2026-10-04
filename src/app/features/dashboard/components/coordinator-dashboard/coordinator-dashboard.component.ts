import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { LoadStateComponent, StatCardComponent } from '../../../../shared/components';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-coordinator-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslateModule, DatePipe, StatCardComponent, LoadStateComponent],
  templateUrl: './coordinator-dashboard.component.html',
})
export class CoordinatorDashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly metrics = this.dashboardService.coordinatorMetrics;
  readonly loading = this.dashboardService.loading;
  readonly error = this.dashboardService.error;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.dashboardService.loadCoordinatorMetrics();
  }
}
