import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

import { LoadStateComponent } from './load-state.component';

@Component({
  imports: [LoadStateComponent],
  template: `
    <app-load-state
      [loading]="loading"
      [error]="error"
      [empty]="empty"
      emptyMessage="EMPTY.KEY"
      (retry)="retried = true"
    >
      <span class="content">CONTENT</span>
    </app-load-state>
  `,
})
class HostComponent {
  loading = false;
  error = false;
  empty = false;
  retried = false;
}

describe('LoadStateComponent', () => {
  async function setup(state: Partial<Pick<HostComponent, 'loading' | 'error' | 'empty'>> = {}) {
    await TestBed.configureTestingModule({
      imports: [HostComponent, TranslateModule.forRoot(), NoopAnimationsModule],
    }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    // Configure the state before the first change detection to avoid NG0100.
    Object.assign(fixture.componentInstance, state);
    fixture.detectChanges();
    return fixture;
  }

  it('projects the content only when idle, non-error and non-empty', async () => {
    const fixture = await setup();
    expect(fixture.debugElement.query(By.css('.content'))).toBeTruthy();
  });

  it('hides content and shows a spinner while loading', async () => {
    const fixture = await setup({ loading: true });
    expect(fixture.debugElement.query(By.css('.content'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.pi-spinner'))).toBeTruthy();
  });

  it('shows the empty state when empty', async () => {
    const fixture = await setup({ empty: true });
    expect(fixture.debugElement.query(By.css('.content'))).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('EMPTY.KEY');
  });

  it('emits retry when the error action is clicked', async () => {
    const fixture = await setup({ error: true });
    fixture.debugElement.query(By.css('p-button button')).nativeElement.click();
    expect(fixture.componentInstance.retried).toBe(true);
  });
});
