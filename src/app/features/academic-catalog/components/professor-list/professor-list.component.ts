import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Paginator } from 'primeng/paginator';
import { debounceTime, finalize, merge, Observable } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import { PageResponse, ProfessorCatalogItem } from '../../../../models';
import {
  CopyableTextComponent,
  CatalogRowLinkDirective,
  CatalogTagComponent,
  I18nSelectComponent,
  LoadStateComponent,
} from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { TOAST_LIFE } from '../../../../shared/utils/toast.util';
import { formatPersonName } from '../../../../shared/utils/person-name.util';
import { ProfessorService } from '../../services/professor.service';
import { activeTagSeverity } from '../../utils/catalog-tag.util';
import {
  CATALOG_ERROR_I18N_SCOPE,
  CatalogError,
  mapProfessorError,
} from '../../utils/catalog-error.util';
import {
  CATALOG_STATUS_FILTER_OPTIONS,
  parseActiveFilter,
} from '../../utils/catalog-filter.options';
import { CatalogListBase } from '../catalog-list.base';

@Component({
  selector: 'app-professor-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    Button,
    Dialog,
    InputText,
    Message,
    I18nSelectComponent,
    LoadStateComponent,
    Paginator,
    CopyableTextComponent,
    CatalogRowLinkDirective,
    CatalogTagComponent,
    DomainErrorMessagePipe,
  ],
  templateUrl: './professor-list.component.html',
})
export class ProfessorListComponent
  extends CatalogListBase<ProfessorCatalogItem>
  implements OnInit
{
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(ProfessorService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);

  protected override readonly filters = this.fb.group({
    search: [''],
    active: ['true'],
  });

  readonly statuses = CATALOG_STATUS_FILTER_OPTIONS;
  readonly activeTagSeverity = activeTagSeverity;
  readonly formatPersonName = formatPersonName;

  readonly catalogErrorScope = CATALOG_ERROR_I18N_SCOPE;
  readonly restoreTarget = signal<ProfessorCatalogItem | null>(null);
  readonly restoring = signal(false);
  readonly restoreError = signal<CatalogError | null>(null);

  override ngOnInit(): void {
    super.ngOnInit();

    merge(
      this.filters.controls.search.valueChanges.pipe(debounceTime(300)),
      this.filters.controls.active.valueChanges,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());
  }

  override clearFilters(): void {
    this.filters.reset({ search: '', active: 'true' }, { emitEvent: false });
    this.applyFilters();
  }

  askRestore(professor: ProfessorCatalogItem): void {
    this.restoreError.set(null);
    this.restoreTarget.set(professor);
  }

  cancelRestore(): void {
    if (this.restoring()) {
      return;
    }
    this.restoreTarget.set(null);
    this.restoreError.set(null);
  }

  confirmRestore(): void {
    const professor = this.restoreTarget();
    if (!professor) {
      return;
    }
    this.restoring.set(true);
    this.restoreError.set(null);
    this.service
      .restoreProfessor(professor.id)
      .pipe(
        finalize(() => this.restoring.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.restoreTarget.set(null);
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

  protected override fetchItems(): Observable<PageResponse<ProfessorCatalogItem>> {
    const filters = this.filters.getRawValue();
    return this.service.listProfessors({
      page: this.page(),
      size: this.pageSize,
      search: filters.search.trim() || undefined,
      active: parseActiveFilter(filters.active),
    });
  }
}
