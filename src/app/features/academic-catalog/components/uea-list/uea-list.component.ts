import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Paginator } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { finalize, Observable } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import { PageResponse, UeaBulkUploadResult, UeaCatalogItem } from '../../../../models';
import { CatalogTagComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { UeaService } from '../../services/uea.service';
import {
  CATALOG_STATUS_FILTER_OPTIONS,
  parseActiveFilter,
} from '../../utils/catalog-filter.options';
import {
  CatalogError,
  CATALOG_ERROR_I18N_SCOPE,
  mapCatalogError,
} from '../../utils/catalog-error.util';
import { CatalogListBase } from '../catalog-list.base';
import type { I18nKey } from '../../../../core/i18n/i18n-keys.generated';
import { BulkErrorCode } from '../../../../models';

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
    Select,
    CatalogTagComponent,
    DomainErrorMessagePipe,
  ],
  templateUrl: './uea-list.component.html',
})
export class UeaListComponent extends CatalogListBase<UeaCatalogItem> {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(UeaService);

  protected override readonly filters = this.fb.group({
    search: [''],
    active: [''],
  });

  readonly statuses = CATALOG_STATUS_FILTER_OPTIONS;
  readonly catalogErrorScope = CATALOG_ERROR_I18N_SCOPE;

  // Bulk upload dialog state
  readonly showBulkDialog = signal(false);
  readonly bulkLoading = signal(false);
  readonly bulkResult = signal<UeaBulkUploadResult | null>(null);
  readonly bulkError = signal<CatalogError | null>(null);
  readonly selectedFile = signal<File | null>(null);

  protected override fetchItems(): Observable<PageResponse<UeaCatalogItem>> {
    const filters = this.filters.getRawValue();
    return this.service.listUeas({
      page: this.page(),
      size: this.pageSize,
      search: filters.search.trim() || undefined,
      active: parseActiveFilter(filters.active),
    });
  }

  ueaActiveTagSeverity(active: boolean): 'success' | 'secondary' {
    return active ? 'success' : 'secondary';
  }

  bulkErrorLabel(code: BulkErrorCode): I18nKey {
    return `ACADEMIC_CATALOG.UEAS.BULK.ERRORS.${code}` as I18nKey;
  }

  openBulkDialog(): void {
    this.bulkResult.set(null);
    this.bulkError.set(null);
    this.selectedFile.set(null);
    this.showBulkDialog.set(true);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
    this.bulkResult.set(null);
    this.bulkError.set(null);
  }

  uploadBulk(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.bulkLoading.set(true);
    this.bulkError.set(null);
    this.bulkResult.set(null);

    this.service
      .bulkUploadUeas(file)
      .pipe(
        finalize(() => this.bulkLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.bulkResult.set(result);
          if (result.created > 0) {
            this.load();
          }
        },
        error: (error) => this.bulkError.set(mapCatalogError(error)),
      });
  }
}
