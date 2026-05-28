import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { LanguageSwitcherComponent } from './language-switcher.component';

describe('LanguageSwitcherComponent', () => {
  let translate: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitcherComponent],
      providers: [
        {
          provide: TranslateService,
          useValue: {
            use: vi.fn(),
            getCurrentLang: () => 'es',
            getFallbackLang: () => 'es',
          },
        },
      ],
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
    localStorage.clear();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('applies default language on init', () => {
    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.detectChanges();
    expect(translate.use).toHaveBeenCalledWith('es');
    expect(fixture.componentInstance.currentLang).toBe('es');
  });

  it('persists language selection to localStorage', () => {
    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.detectChanges();

    fixture.componentInstance.onLanguageChange('en');

    expect(localStorage.getItem('lang')).toBe('en');
    expect(translate.use).toHaveBeenCalledWith('en');
  });
});
