import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Observable } from 'rxjs';

import { PageResponse } from '../../../../models';
import { StudentCatalogItem } from '../../../../models';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { StudentService } from '../../services/student.service';
import {
  CATALOG_PROGRAM_TYPE_FILTER_OPTIONS,
  CATALOG_STATUS_FILTER_OPTIONS,
  parseActiveFilter,
  parseProgramTypeFilter,
} from '../../utils/catalog-filter.options';
import { CatalogListBase } from '../catalog-list.base';

@Component({
  selector: 'app-student-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, Button, InputText, Select],
  templateUrl: './student-list.component.html',
})
export class StudentListComponent extends CatalogListBase<StudentCatalogItem> {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(StudentService);

  protected override readonly filters = this.fb.group({
    search: [''],
    programType: [''],
    active: [''],
  });

  readonly programTypes = CATALOG_PROGRAM_TYPE_FILTER_OPTIONS;
  readonly statuses = CATALOG_STATUS_FILTER_OPTIONS;

  protected override fetchItems(): Observable<PageResponse<StudentCatalogItem>> {
    const filters = this.filters.getRawValue();
    return this.service.listStudents({
      page: this.page(),
      size: this.pageSize,
      search: filters.search.trim() || undefined,
      programType: parseProgramTypeFilter(filters.programType),
      active: parseActiveFilter(filters.active),
    });
  }
}
