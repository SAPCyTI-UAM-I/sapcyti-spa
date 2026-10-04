import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { LoadStateComponent } from '../../../../shared/components';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-professor-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslateModule, LoadStateComponent],
  templateUrl: './professor-dashboard.component.html',
})
export class ProfessorDashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly professorData = this.dashboardService.professorData;
  readonly loading = this.dashboardService.loading;
  readonly error = this.dashboardService.error;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.dashboardService.loadProfessorData();
  }
}
