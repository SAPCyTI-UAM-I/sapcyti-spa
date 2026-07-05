import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
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
import { finalize, Observable } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import { PageResponse, UeaCatalogItem } from '../../../../models';
import {
  CatalogTagComponent,
  CopyableTextComponent,
  I18nSelectComponent,
  LoadStateComponent,
} from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { TOAST_LIFE } from '../../../../shared/utils/toast.util';
import { UeaService } from '../../services/uea.service';
import { CATALOG_ERROR_I18N_SCOPE } from '../../utils/catalog-error.util';
import {
  CATALOG_STATUS_FILTER_OPTIONS,
  parseActiveFilter,
} from '../../utils/catalog-filter.options';
import { activeTagSeverity } from '../../utils/catalog-tag.util';
import { UeaError, mapUeaError } from '../../utils/uea-error.util';
import { CatalogListBase } from '../catalog-list.base';
import { UeaBulkUploadDialogComponent } from '../uea-bulk-upload-dialog/uea-bulk-upload-dialog.component';

@Component({
  selector: 'app-uea-list',
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
    Paginator,
    I18nSelectComponent,
    LoadStateComponent,
    CatalogTagComponent,
    CopyableTextComponent,
    DomainErrorMessagePipe,
    UeaBulkUploadDialogComponent,
  ],
  templateUrl: './uea-list.component.html',
})
export class UeaListComponent extends CatalogListBase<UeaCatalogItem> {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(UeaService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);

  override readonly pageSize = 8;

  readonly expandedNameId = signal<number | null>(null);

  readonly catalogErrorScope = CATALOG_ERROR_I18N_SCOPE;
  readonly restoreTarget = signal<UeaCatalogItem | null>(null);
  readonly restoring = signal(false);
  readonly restoreError = signal<UeaError | null>(null);

  toggleName(id: number): void {
    this.expandedNameId.update((current) => (current === id ? null : id));
  }

  protected override readonly filters = this.fb.group({
    search: [''],
    active: [''],
  });

  readonly statuses = CATALOG_STATUS_FILTER_OPTIONS;
  readonly activeTagSeverity = activeTagSeverity;

  private readonly bulkDialog = viewChild.required(UeaBulkUploadDialogComponent);

  askRestore(uea: UeaCatalogItem): void {
    this.restoreError.set(null);
    this.restoreTarget.set(uea);
  }

  cancelRestore(): void {
    if (this.restoring()) {
      return;
    }
    this.restoreTarget.set(null);
    this.restoreError.set(null);
  }

  confirmRestore(): void {
    const uea = this.restoreTarget();
    if (!uea) {
      return;
    }
    this.restoring.set(true);
    this.restoreError.set(null);
    this.service
      .restoreUea(uea.id)
      .pipe(
        finalize(() => this.restoring.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.restoreTarget.set(null);
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant('ACADEMIC_CATALOG.UEAS.RESTORE.SUCCESS'),
            life: TOAST_LIFE.DEFAULT,
          });
          this.load();
        },
        error: (err) => this.restoreError.set(mapUeaError(err)),
      });
  }

  protected override fetchItems(): Observable<PageResponse<UeaCatalogItem>> {
    const filters = this.filters.getRawValue();
    return this.service.listUeas({
      page: this.page(),
      size: this.pageSize,
      search: filters.search.trim() || undefined,
      active: parseActiveFilter(filters.active),
    });
  }

  openBulkDialog(): void {
    this.bulkDialog().open();
  }
}
