import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Paginator } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { Observable } from 'rxjs';

import { PageResponse, UeaCatalogItem } from '../../../../models';
import { CatalogTagComponent, CopyableTextComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { UeaService } from '../../services/uea.service';
import {
  CATALOG_STATUS_FILTER_OPTIONS,
  parseActiveFilter,
} from '../../utils/catalog-filter.options';
import { activeTagSeverity } from '../../utils/catalog-tag.util';
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
    InputText,
    Paginator,
    Select,
    CatalogTagComponent,
    CopyableTextComponent,
    UeaBulkUploadDialogComponent,
  ],
  templateUrl: './uea-list.component.html',
})
export class UeaListComponent extends CatalogListBase<UeaCatalogItem> {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(UeaService);

  override readonly pageSize = 8;

  readonly expandedNameId = signal<number | null>(null);

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
