import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { LoadStateComponent } from '../../../../shared/components';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-student-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslateModule, DatePipe, LoadStateComponent],
  templateUrl: './student-dashboard.component.html',
})
export class StudentDashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly studentData = this.dashboardService.studentData;
  readonly loading = this.dashboardService.loading;
  readonly error = this.dashboardService.error;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.dashboardService.loadStudentData();
  }
}
