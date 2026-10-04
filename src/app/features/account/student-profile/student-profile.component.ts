import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Message } from 'primeng/message';
import { finalize } from 'rxjs';

import { EnrollmentHistoryEntry, StudentDetailResponse } from '../../../models';
import {
  BackButtonComponent,
  StudentEnrollmentHistoryComponent,
  StudentProfileCardComponent,
} from '../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../shared/layout/routed-page-host';
import { StudentProfileService } from '../services/student-profile.service';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    TranslatePipe,
    Message,
    BackButtonComponent,
    StudentProfileCardComponent,
    StudentEnrollmentHistoryComponent,
  ],
  templateUrl: './student-profile.component.html',
})
export class StudentProfileComponent {
  private readonly router = inject(Router);
  private readonly service = inject(StudentProfileService);
  private readonly destroyRef = inject(DestroyRef);

  readonly student = signal<StudentDetailResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly history = signal<EnrollmentHistoryEntry[]>([]);
  readonly historyLoading = signal(true);
  readonly historyError = signal(false);

  constructor() {
    this.loadProfile();
    this.loadHistory();
  }

  backToDashboard(): void {
    void this.router.navigateByUrl('/dashboard');
  }

  loadProfile(): void {
    this.loading.set(true);
    this.error.set(false);

    this.service
      .getMyProfile()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (student) => this.student.set(student),
        error: () => this.error.set(true),
      });
  }

  loadHistory(): void {
    this.historyLoading.set(true);
    this.historyError.set(false);

    this.service
      .getMyEnrollmentHistory()
      .pipe(
        finalize(() => this.historyLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (entries) => this.history.set(entries),
        error: () => {
          this.history.set([]);
          this.historyError.set(true);
        },
      });
  }
}
