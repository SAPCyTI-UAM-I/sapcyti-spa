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

import { PageResponse, StudentCatalogItem } from '../../../../models';
import { CopyableTextComponent, CatalogTagComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { StudentService } from '../../services/student.service';
import {
  programTypeTagSeverity,
  studentActiveTagSeverity,
} from '../../utils/catalog-tag.util';
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
  templateUrl: './student-list.component.html',
})
export class StudentListComponent extends CatalogListBase<StudentCatalogItem> implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(StudentService);

  protected override readonly filters = this.fb.group({
    search: [''],
    programType: [''],
    active: [''],
  });

  readonly programTypes = CATALOG_PROGRAM_TYPE_FILTER_OPTIONS;
  readonly statuses = CATALOG_STATUS_FILTER_OPTIONS;
  readonly programTypeTagSeverity = programTypeTagSeverity;
  readonly studentActiveTagSeverity = studentActiveTagSeverity;

  override ngOnInit(): void {
    super.ngOnInit();

    merge(
      this.filters.controls.search.valueChanges.pipe(debounceTime(300)),
      this.filters.controls.programType.valueChanges,
      this.filters.controls.active.valueChanges,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());
  }

  override clearFilters(): void {
    this.filters.reset({ search: '', programType: '', active: '' }, { emitEvent: false });
    this.applyFilters();
  }

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
