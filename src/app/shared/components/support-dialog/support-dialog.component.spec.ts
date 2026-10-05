import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

import { DEFAULT_SUPPORT_EMAIL, SupportDialogComponent } from './support-dialog.component';

describe('SupportDialogComponent', () => {
  let fixture: ComponentFixture<SupportDialogComponent>;
  let component: SupportDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupportDialogComponent, TranslateModule.forRoot()],
      providers: [{ provide: MessageService, useValue: { add: vi.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(SupportDialogComponent);
    component = fixture.componentInstance;
  });

  it('renders support email and message when visible is true', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();

    const link = document.querySelector('[data-testid="support-email-link"]');
    expect(link).toBeTruthy();
    expect(link?.textContent?.trim()).toBe(DEFAULT_SUPPORT_EMAIL);
    expect(link?.getAttribute('href')).toBe(`mailto:${DEFAULT_SUPPORT_EMAIL}`);
  });

  it('dismisses modal and emits closed event when dismiss is called', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();

    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);

    component.dismiss();
    fixture.detectChanges();

    expect(component.visible()).toBe(false);
    expect(closedSpy).toHaveBeenCalledTimes(1);
  });
});
