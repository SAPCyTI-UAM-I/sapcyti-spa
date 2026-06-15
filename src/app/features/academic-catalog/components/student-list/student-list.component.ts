import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { finalize } from 'rxjs';

import { StudentCatalogItem } from '../../../../models/student.model';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-student-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, Button, InputText, Select],
  templateUrl: './student-list.component.html',
})
export class StudentListComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(StudentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly students = signal<StudentCatalogItem[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly page = signal(0);
  readonly pageSize = 10;
  readonly totalElements = signal(0);

  readonly filters = this.fb.group({
    search: [''],
    programType: [''],
    active: [''],
  });

  readonly programTypes = [
    { label: 'ACADEMIC_CATALOG.FILTERS.ALL', value: '' },
    { label: 'ACADEMIC_CATALOG.PROGRAM_TYPES.MAESTRIA', value: 'MAESTRIA' },
    { label: 'ACADEMIC_CATALOG.PROGRAM_TYPES.DOCTORADO', value: 'DOCTORADO' },
  ];

  readonly statuses = [
    { label: 'ACADEMIC_CATALOG.FILTERS.ALL', value: '' },
    { label: 'ACADEMIC_CATALOG.STATUS.ACTIVE', value: 'true' },
    { label: 'ACADEMIC_CATALOG.STATUS.INACTIVE', value: 'false' },
  ];

  ngOnInit(): void {
    this.load();
  }

  applyFilters(): void {
    this.page.set(0);
    this.load();
  }

  clearFilters(): void {
    this.filters.reset();
    this.applyFilters();
  }

  previousPage(): void {
    if (this.page() === 0) return;
    this.page.update((value) => value - 1);
    this.load();
  }

  nextPage(): void {
    if ((this.page() + 1) * this.pageSize >= this.totalElements()) return;
    this.page.update((value) => value + 1);
    this.load();
  }

  load(): void {
    const filters = this.filters.getRawValue();
    this.loading.set(true);
    this.loadError.set(false);
    this.service
      .listStudents({
        page: this.page(),
        size: this.pageSize,
        search: filters.search.trim() || undefined,
        programType:
          filters.programType === 'MAESTRIA' || filters.programType === 'DOCTORADO'
            ? filters.programType
            : undefined,
        active: filters.active === '' ? undefined : filters.active === 'true',
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.students.set(response.content);
          this.totalElements.set(response.totalElements);
        },
        error: () => {
          this.students.set([]);
          this.loadError.set(true);
        },
      });
  }
}
