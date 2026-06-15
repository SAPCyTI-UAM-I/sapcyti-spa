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

import { ProfessorCatalogItem } from '../../../../models/professor.model';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { ProfessorService } from '../../services/professor.service';

@Component({
  selector: 'app-professor-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, Button, InputText, Select],
  templateUrl: './professor-list.component.html',
})
export class ProfessorListComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(ProfessorService);
  private readonly destroyRef = inject(DestroyRef);

  readonly professors = signal<ProfessorCatalogItem[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly page = signal(0);
  readonly pageSize = 10;
  readonly totalElements = signal(0);
  readonly filters = this.fb.group({ search: [''], active: [''] });
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
      .listProfessors({
        page: this.page(),
        size: this.pageSize,
        search: filters.search.trim() || undefined,
        active: filters.active === '' ? undefined : filters.active === 'true',
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.professors.set(response.content);
          this.totalElements.set(response.totalElements);
        },
        error: () => {
          this.professors.set([]);
          this.loadError.set(true);
        },
      });
  }
}
