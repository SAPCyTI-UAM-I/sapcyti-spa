import { DestroyRef, Directive, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { finalize, Observable } from 'rxjs';

import { PageResponse } from '../../../models';

@Directive()
export abstract class CatalogListBase<TItem> implements OnInit {
  protected readonly destroyRef = inject(DestroyRef);

  readonly items = signal<TItem[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly page = signal(0);
  readonly pageSize = 10;
  readonly totalElements = signal(0);

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

  previousPage(): void {
    if (this.page() === 0) {
      return;
    }
    this.page.update((value) => value - 1);
    this.load();
  }

  nextPage(): void {
    if ((this.page() + 1) * this.pageSize >= this.totalElements()) {
      return;
    }
    this.page.update((value) => value + 1);
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
