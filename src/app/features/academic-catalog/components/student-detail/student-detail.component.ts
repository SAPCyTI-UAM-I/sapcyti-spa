import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { finalize } from 'rxjs';

import {
  EnrollmentHistoryEntry,
  getLineOfKnowledgeLabelKey,
  getResearchAreaLabelKey,
  StudentDetailResponse,
} from '../../../../models';
import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import {
  CatalogTagComponent,
  CopyableTextComponent,
  LoadStateComponent,
} from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { StudentService } from '../../services/student.service';
import { formatProfessorName } from '../../utils/professor-display.util';
import { programStatusSeverity, programTypeTagSeverity } from '../../utils/catalog-tag.util';
import {
  CATALOG_ERROR_I18N_SCOPE,
  mapCatalogError,
  CatalogError,
} from '../../utils/catalog-error.util';

@Component({
  selector: 'app-student-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    RouterLink,
    TranslatePipe,
    Button,
    Message,
    DomainErrorMessagePipe,
    CopyableTextComponent,
    CatalogTagComponent,
    LoadStateComponent,
  ],
  templateUrl: './student-detail.component.html',
})
export class StudentDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(StudentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly studentId = Number(this.route.snapshot.paramMap.get('studentId'));

  readonly loading = signal(true);
  readonly error = signal<CatalogError | null>(null);
  readonly student = signal<StudentDetailResponse | null>(null);

  /** HU-61 — histórico de UEAs y grupos por trimestre; solo lectura. */
  readonly history = signal<EnrollmentHistoryEntry[]>([]);
  readonly historyLoading = signal(true);
  readonly historyError = signal(false);

  readonly formatProfessorName = formatProfessorName;
  readonly getLineOfKnowledgeLabelKey = getLineOfKnowledgeLabelKey;
  readonly getResearchAreaLabelKey = getResearchAreaLabelKey;
  readonly programStatusSeverity = programStatusSeverity;
  readonly programTypeTagSeverity = programTypeTagSeverity;
  readonly catalogErrorScope = CATALOG_ERROR_I18N_SCOPE;

  constructor() {
    this.load();
    this.loadHistory();
  }

  backToCatalog(): void {
    void this.router.navigateByUrl('/academic-catalog/students');
  }

  editRoute(): string[] {
    return ['/academic-catalog/students', String(this.studentId), 'edit'];
  }

  initials(): string {
    const current = this.student();
    if (!current) {
      return '';
    }
    const first = current.firstName?.trim().charAt(0) ?? '';
    const last = current.firstLastName?.trim().charAt(0) ?? '';
    return `${first}${last}`.toUpperCase();
  }

  loadHistory(): void {
    if (!Number.isInteger(this.studentId)) {
      this.historyLoading.set(false);
      return;
    }

    this.historyLoading.set(true);
    this.historyError.set(false);
    this.service
      .getEnrollmentHistory(this.studentId)
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

  private load(): void {
    if (!Number.isInteger(this.studentId)) {
      this.loading.set(false);
      this.error.set('reference_not_found');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.service
      .getStudent(this.studentId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (student) => this.student.set(student),
        error: (err) => this.error.set(mapCatalogError(err)),
      });
  }
}
