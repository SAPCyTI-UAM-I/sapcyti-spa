import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Paginator } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { debounceTime, merge, Observable } from 'rxjs';

import { PageResponse, ProfessorCatalogItem } from '../../../../models';
import { CopyableTextComponent, CatalogTagComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { ProfessorService } from '../../services/professor.service';
import { activeTagSeverity } from '../../utils/catalog-tag.util';
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
    InputText,
    Select,
    Paginator,
    CopyableTextComponent,
    CatalogTagComponent,
  ],
  templateUrl: './professor-list.component.html',
})
export class ProfessorListComponent extends CatalogListBase<ProfessorCatalogItem> implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(ProfessorService);

  protected override readonly filters = this.fb.group({
    search: [''],
    active: ['true'],
  });

  readonly statuses = CATALOG_STATUS_FILTER_OPTIONS;
  readonly activeTagSeverity = activeTagSeverity;

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
