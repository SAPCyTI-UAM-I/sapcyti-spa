import { computed, DestroyRef, Directive, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { PaginatorState } from 'primeng/paginator';
import { finalize, Observable } from 'rxjs';

import { PageResponse } from '../../../models';

@Directive()
export abstract class CatalogListBase<TItem> implements OnInit {
  protected readonly destroyRef = inject(DestroyRef);

  readonly items = signal<TItem[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly page = signal(0);
  readonly pageSize: number = 10;
  readonly totalElements = signal(0);
  readonly first = computed(() => this.page() * this.pageSize);

  /** Optional column sort (`field,dir`), sent to the backend/mock; null = default order. */
  readonly sortField = signal<string | null>(null);
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  readonly sortParam = computed(() =>
    this.sortField() ? `${this.sortField()},${this.sortDir()}` : undefined,
  );

  sortBy(field: string): void {
    if (this.sortField() === field) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
    this.page.set(0);
    this.load();
  }

  ariaSort(field: string): 'ascending' | 'descending' | 'none' {
    if (this.sortField() !== field) {
      return 'none';
    }
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  sortIcon(field: string): string {
    if (this.sortField() !== field) {
      return 'pi-sort-alt text-text-tertiary';
    }
    return this.sortDir() === 'asc' ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down';
  }

  protected abstract readonly filters: FormGroup;
  protected abstract fetchItems(): Observable<PageResponse<TItem>>;

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

  onPageChange(event: PaginatorState): void {
    const rows = event.rows ?? this.pageSize;
    const first = event.first ?? 0;
    const nextPage = rows > 0 ? first / rows : 0;

    if (nextPage === this.page()) {
      return;
    }

    this.page.set(nextPage);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.fetchItems()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.items.set(response.content);
          this.totalElements.set(response.totalElements);
        },
        error: () => {
          this.items.set([]);
          this.loadError.set(true);
        },
      });
  }
}
