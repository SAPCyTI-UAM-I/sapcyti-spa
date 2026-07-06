import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { finalize } from 'rxjs';

import { ProfessorDetailResponse } from '../../../../models';
import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import { CatalogTagComponent, CopyableTextComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { TOAST_LIFE } from '../../../../shared/utils/toast.util';
import { ProfessorService } from '../../services/professor.service';
import { activeTagSeverity } from '../../utils/catalog-tag.util';
import {
  CATALOG_ERROR_I18N_SCOPE,
  CatalogError,
  mapProfessorError,
} from '../../utils/catalog-error.util';

@Component({
  selector: 'app-professor-detail',
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
  ],
  templateUrl: './professor-detail.component.html',
})
export class ProfessorDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ProfessorService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly professorId = Number(this.route.snapshot.paramMap.get('professorId'));

  readonly loading = signal(true);
  readonly error = signal<CatalogError | null>(null);
  readonly professor = signal<ProfessorDetailResponse | null>(null);
  readonly restoring = signal(false);
  readonly restoreError = signal<CatalogError | null>(null);

  readonly activeTagSeverity = activeTagSeverity;
  readonly catalogErrorScope = CATALOG_ERROR_I18N_SCOPE;

  constructor() {
    this.load();
  }

  backToCatalog(): void {
    void this.router.navigateByUrl('/academic-catalog/professors');
  }

  editRoute(): string[] {
    return ['/academic-catalog/professors', String(this.professorId), 'edit'];
  }

  /** HU-54 — reactivate an inactive professor (moved here from the list actions column). */
  restore(): void {
    this.restoring.set(true);
    this.restoreError.set(null);
    this.service
      .restoreProfessor(this.professorId)
      .pipe(
        finalize(() => this.restoring.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant('ACADEMIC_CATALOG.PROFESSORS.RESTORE.SUCCESS'),
            life: TOAST_LIFE.DEFAULT,
          });
          this.load();
        },
        error: (err) => this.restoreError.set(mapProfessorError(err)),
      });
  }

  professorTypeLabelKey(professor: ProfessorDetailResponse): string {
    return professor.professorType === 'INTERNO'
      ? 'ACADEMIC_CATALOG.PROFESSORS.TYPES.INTERNO'
      : 'ACADEMIC_CATALOG.PROFESSORS.TYPES.EXTERNO';
  }

  initials(): string {
    const current = this.professor();
    if (!current) {
      return '';
    }
    const first = current.firstName?.trim().charAt(0) ?? '';
    const last = current.firstLastName?.trim().charAt(0) ?? '';
    return `${first}${last}`.toUpperCase();
  }

  private load(): void {
    if (!Number.isInteger(this.professorId)) {
      this.loading.set(false);
      this.error.set('professor_not_found');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.service
      .getProfessor(this.professorId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (professor) => this.professor.set(professor),
        error: (err) => this.error.set(mapProfessorError(err)),
      });
  }
}
