import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { BreadcrumbItem } from '../../../shell/breadcrumb';
import { BreadcrumbComponent } from './breadcrumb.component';

function create(items: readonly BreadcrumbItem[]) {
  TestBed.configureTestingModule({
    imports: [BreadcrumbComponent, TranslateModule.forRoot()],
    providers: [provideRouter([])],
  });
  const fixture = TestBed.createComponent(BreadcrumbComponent);
  fixture.componentRef.setInput('items', items);
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('BreadcrumbComponent', () => {
  it('shows every crumb when there are two or fewer', () => {
    const component = create([
      { labelKey: 'A', url: '/a' },
      { labelKey: 'B', url: '/a/b' },
    ]);

    expect(component.collapsed()).toBe(false);
    expect(component.visible()).toHaveLength(2);
  });

  it('collapses to the last crumb when there are more than two', () => {
    const component = create([
      { labelKey: 'A', url: '/a' },
      { labelKey: 'B', url: '/a/b' },
      { labelKey: 'C', url: '/a/b/c' },
    ]);

    expect(component.collapsed()).toBe(true);
    expect(component.visible()).toEqual([{ labelKey: 'C', url: '/a/b/c' }]);
  });

  it('renders intermediate crumbs as text, keeping only home navigable', async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbComponent, TranslateModule.forRoot()],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(BreadcrumbComponent);
    fixture.componentRef.setInput('items', [
      { labelKey: 'A', url: '/a' },
      { labelKey: 'B', url: '/a/b' },
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('a[routerlink="/dashboard"]')).not.toBeNull();
    expect(el.querySelectorAll('a').length).toBe(1);
    expect(el.querySelector('span[aria-current="page"]')?.textContent?.trim()).toBe('B');
  });
});
