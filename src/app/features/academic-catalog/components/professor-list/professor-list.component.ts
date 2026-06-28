import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Paginator } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { Observable } from 'rxjs';

import { PageResponse } from '../../../../models';
import { ProfessorCatalogItem } from '../../../../models';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { formatProfessorName } from '../../utils/professor-display.util';
import { ProfessorService } from '../../services/professor.service';
import {
  CATALOG_STATUS_FILTER_OPTIONS,
  parseActiveFilter,
} from '../../utils/catalog-filter.options';
import { CatalogListBase } from '../catalog-list.base';

@Component({
  selector: 'app-professor-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, Button, InputText, Select, Paginator],
  templateUrl: './professor-list.component.html',
})
export class ProfessorListComponent extends CatalogListBase<ProfessorCatalogItem> {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(ProfessorService);

  protected override readonly filters = this.fb.group({
    search: [''],
    active: [''],
  });

  readonly statuses = CATALOG_STATUS_FILTER_OPTIONS;
  readonly formatProfessorName = formatProfessorName;

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
