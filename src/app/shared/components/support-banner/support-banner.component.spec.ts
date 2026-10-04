import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

import { SupportBannerComponent, DEFAULT_SUPPORT_EMAIL } from './support-banner.component';

describe('SupportBannerComponent', () => {
  let fixture: ComponentFixture<SupportBannerComponent>;
  let component: SupportBannerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupportBannerComponent, TranslateModule.forRoot()],
      providers: [{ provide: MessageService, useValue: { add: vi.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(SupportBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders support email and message when visible', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const banner = compiled.querySelector('[data-testid="support-banner"]');
    expect(banner).toBeTruthy();

    const link = compiled.querySelector('[data-testid="support-email-link"]');
    expect(link?.textContent?.trim()).toBe(DEFAULT_SUPPORT_EMAIL);
    expect(link?.getAttribute('href')).toBe(`mailto:${DEFAULT_SUPPORT_EMAIL}`);
  });

  it('dismisses banner and emits closed event when close button is clicked', () => {
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);

    const compiled = fixture.nativeElement as HTMLElement;
    const closeBtn = compiled.querySelector<HTMLButtonElement>(
      '[data-testid="close-support-banner"] button, button[data-testid="close-support-banner"]',
    );
    expect(closeBtn).toBeTruthy();
    closeBtn?.click();
    fixture.detectChanges();

    expect(component.visible()).toBe(false);
    expect(closedSpy).toHaveBeenCalledTimes(1);
    expect(compiled.querySelector('[data-testid="support-banner"]')).toBeNull();
  });
});
