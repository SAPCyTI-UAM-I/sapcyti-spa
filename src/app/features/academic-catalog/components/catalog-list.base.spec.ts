import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NonNullableFormBuilder } from '@angular/forms';
import { Observable, of, throwError } from 'rxjs';

import { PageResponse } from '../../../models';
import { CatalogListBase } from './catalog-list.base';

interface TestItem {
  id: number;
}

@Component({
  selector: 'app-test-catalog-list',
  template: '',
})
class TestListComponent extends CatalogListBase<TestItem> {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly fetchItemsSpy = vi.fn<() => Observable<PageResponse<TestItem>>>();

  protected override readonly filters = this.fb.group({
    search: [''],
  });

  protected override fetchItems(): Observable<PageResponse<TestItem>> {
    return this.fetchItemsSpy();
  }

  patchSearch(value: string): void {
    this.filters.patchValue({ search: value });
  }

  getSearchFilter(): string {
    return this.filters.getRawValue().search;
  }
}

function buildPageResponse(
  content: TestItem[],
  totalElements = content.length,
): PageResponse<TestItem> {
  return {
    content,
    totalElements,
    totalPages: Math.ceil(totalElements / 10) || 1,
    size: 10,
    number: 0,
  };
}

describe('CatalogListBase', () => {
  function setup(): TestListComponent {
    const fixture = TestBed.createComponent(TestListComponent);
    return fixture.componentInstance;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestListComponent],
    }).compileComponents();
  });

  it('ngOnInit triggers load once', () => {
    const fixture = TestBed.createComponent(TestListComponent);
    fixture.componentInstance.fetchItemsSpy.mockReturnValue(of(buildPageResponse([{ id: 1 }])));
    fixture.detectChanges();

    expect(fixture.componentInstance.fetchItemsSpy).toHaveBeenCalledTimes(1);
  });

  it('load() on success sets items, totalElements, loading=false and loadError=false', () => {
    const component = setup();
    const response = buildPageResponse([{ id: 1 }, { id: 2 }], 25);
    component.fetchItemsSpy.mockReturnValue(of(response));

    component.load();

    expect(component.items()).toEqual([{ id: 1 }, { id: 2 }]);
    expect(component.totalElements()).toBe(25);
    expect(component.loading()).toBe(false);
    expect(component.loadError()).toBe(false);
  });

  it('load() on error clears items, sets loadError=true and loading=false', () => {
    const component = setup();
    component.items.set([{ id: 1 }]);
    component.fetchItemsSpy.mockReturnValue(throwError(() => new Error('load failed')));

    component.load();

    expect(component.items()).toEqual([]);
    expect(component.loadError()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it('applyFilters() resets page to 0 and reloads', () => {
    const component = setup();
    component.fetchItemsSpy.mockReturnValue(of(buildPageResponse([])));
    component.page.set(2);

    component.applyFilters();

    expect(component.page()).toBe(0);
    expect(component.fetchItemsSpy).toHaveBeenCalledTimes(1);
  });

  it('clearFilters() resets the form and reloads', () => {
    const component = setup();
    component.fetchItemsSpy.mockReturnValue(of(buildPageResponse([])));
    component.patchSearch('query');
    component.page.set(1);

    component.clearFilters();

    expect(component.getSearchFilter()).toBe('');
    expect(component.page()).toBe(0);
    expect(component.fetchItemsSpy).toHaveBeenCalledTimes(1);
  });

  it('first is derived from page and pageSize', () => {
    const component = setup();
    component.page.set(2);

    expect(component.first()).toBe(20);
  });

  it('onPageChange() ignores events that keep the same page', () => {
    const component = setup();
    component.fetchItemsSpy.mockReturnValue(of(buildPageResponse([])));
    component.load();
    component.fetchItemsSpy.mockClear();

    component.onPageChange({ first: 0, rows: 10, page: 0, pageCount: 1 });

    expect(component.page()).toBe(0);
    expect(component.fetchItemsSpy).not.toHaveBeenCalled();
  });

  it('onPageChange() advances page from first/rows and reloads', () => {
    const component = setup();
    component.fetchItemsSpy.mockReturnValue(of(buildPageResponse([{ id: 1 }], 11)));
    component.load();
    component.fetchItemsSpy.mockClear();

    component.onPageChange({ first: 10, rows: 10, page: 1, pageCount: 2 });

    expect(component.page()).toBe(1);
    expect(component.first()).toBe(10);
    expect(component.fetchItemsSpy).toHaveBeenCalledTimes(1);
  });

  it('onPageChange() decrements page from first/rows and reloads', () => {
    const component = setup();
    component.fetchItemsSpy.mockReturnValue(of(buildPageResponse([])));
    component.page.set(2);
    component.fetchItemsSpy.mockClear();

    component.onPageChange({ first: 10, rows: 10, page: 1, pageCount: 3 });

    expect(component.page()).toBe(1);
    expect(component.first()).toBe(10);
    expect(component.fetchItemsSpy).toHaveBeenCalledTimes(1);
  });
});
