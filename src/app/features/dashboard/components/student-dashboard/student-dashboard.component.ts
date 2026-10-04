import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import {
  CatalogTagComponent,
  CopyableTextComponent,
  LoadStateComponent,
} from '../../../../shared/components';
import {
  CatalogTagSeverity,
  programTypeTagSeverity,
} from '../../../../shared/utils/catalog-tag.util';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslateModule,
    DatePipe,
    LoadStateComponent,
    CatalogTagComponent,
    CopyableTextComponent,
  ],
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

  initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.charAt(0) ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';
    return `${first}${last}`.toUpperCase();
  }

  programSeverity(type: string): CatalogTagSeverity {
    if (type === 'MAESTRIA' || type === 'DOCTORADO') {
      return programTypeTagSeverity(type);
    }
    return 'secondary';
  }
}
