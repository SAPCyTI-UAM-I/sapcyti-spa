import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

import { APP_VERSION } from '../../../core/config/app-version';
import { AuthFooterComponent } from './auth-footer.component';

describe('AuthFooterComponent', () => {
  let fixture: ComponentFixture<AuthFooterComponent>;
  let component: AuthFooterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthFooterComponent, TranslateModule.forRoot()],
      providers: [{ provide: MessageService, useValue: { add: vi.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders copyright and system version', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(`v${APP_VERSION}`);
  });

  it('does not show support dialog by default', () => {
    expect(component.supportVisible()).toBe(false);
  });

  it('opens support dialog when support button is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const supportBtn = compiled.querySelector<HTMLButtonElement>('[data-testid="support-button"]');
    expect(supportBtn).toBeTruthy();

    supportBtn?.click();
    fixture.detectChanges();

    expect(component.supportVisible()).toBe(true);
  });
});
