import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ShellSidebarLinkComponent } from './shell-sidebar-link.component';

describe('ShellSidebarLinkComponent', () => {
  async function create(
    inputs: Partial<{
      route: string;
      labelKey: string;
      icon: string;
      collapsed: boolean;
      disabled: boolean;
      disabledReasonKey: string | null;
    }> = {},
  ) {
    await TestBed.configureTestingModule({
      imports: [ShellSidebarLinkComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(ShellSidebarLinkComponent);
    fixture.componentRef.setInput('route', inputs.route ?? '/exam-requests');
    fixture.componentRef.setInput('labelKey', inputs.labelKey ?? 'SHELL.MENU.EXAM_REQUEST');
    fixture.componentRef.setInput('icon', inputs.icon ?? 'pi pi-verified');
    fixture.componentRef.setInput('collapsed', inputs.collapsed ?? false);
    fixture.componentRef.setInput('disabled', inputs.disabled ?? false);
    fixture.componentRef.setInput('disabledReasonKey', inputs.disabledReasonKey ?? null);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a navigable link when enabled', async () => {
    const fixture = await create();
    const link = fixture.debugElement.query(By.css('a'));

    expect(link).not.toBeNull();
    expect(link.nativeElement.getAttribute('href')).toBe('/exam-requests');
    expect(link.nativeElement.className).toContain('hover:bg-surface-subtle');
    expect(fixture.debugElement.query(By.css('[aria-disabled="true"]'))).toBeNull();
  });

  it('renders a non-navigable control when disabled', async () => {
    const fixture = await create({
      disabled: true,
      disabledReasonKey: 'EXAM_REQUEST.ELIGIBILITY.PROGRAM_BAJA',
    });
    const control = fixture.debugElement.query(By.css('[aria-disabled="true"]'));

    expect(fixture.debugElement.query(By.css('a'))).toBeNull();
    expect(control).not.toBeNull();
    expect(control.nativeElement.getAttribute('tabindex')).toBe('-1');
    expect(control.nativeElement.className).toContain('text-text-tertiary');
    expect(control.nativeElement.className).not.toContain('hover:bg-surface-subtle');
  });

  it('keeps the eligibility tooltip when the sidebar is collapsed', async () => {
    const fixture = await create({
      disabled: true,
      collapsed: true,
      disabledReasonKey: 'EXAM_REQUEST.ELIGIBILITY.PROGRAM_SUSPENSION',
    });

    expect(fixture.componentInstance.tooltipKey()).toBe(
      'EXAM_REQUEST.ELIGIBILITY.PROGRAM_SUSPENSION',
    );
    expect(fixture.debugElement.query(By.css('[aria-disabled="true"]'))).not.toBeNull();
  });
});
