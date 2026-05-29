import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SelectButton } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';

import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  LANGUAGE_STORAGE_KEY,
  SupportedLanguage,
} from '../../../core/i18n/language.constants';

interface LanguageOption {
  label: string;
  value: SupportedLanguage;
}

@Component({
  selector: 'app-language-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex',
    '[class.auth-lang-switcher]': 'variant() === "auth"',
  },
  imports: [SelectButton, FormsModule],
  template: `
    <p-selectbutton
      [options]="options"
      [(ngModel)]="currentLang"
      optionLabel="label"
      optionValue="value"
      [allowEmpty]="false"
      aria-label="Language"
      (ngModelChange)="onLanguageChange($event)"
    />
  `,
})
export class LanguageSwitcherComponent implements OnInit {
  readonly variant = input<'default' | 'auth'>('default');

  private readonly translate = inject(TranslateService);

  readonly options: LanguageOption[] = [
    { label: 'ES', value: 'es' },
    { label: 'EN', value: 'en' },
  ];

  currentLang: SupportedLanguage = DEFAULT_LANGUAGE;

  ngOnInit(): void {
    const stored = this.readStoredLanguage();
    this.applyLanguage(stored);
  }

  onLanguageChange(lang: SupportedLanguage): void {
    this.applyLanguage(lang);
    this.persistLanguage(lang);
  }

  private applyLanguage(lang: SupportedLanguage): void {
    this.currentLang = lang;
    this.translate.use(lang);
  }

  private readStoredLanguage(): SupportedLanguage {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && isSupportedLanguage(stored)) {
        return stored;
      }
    } catch {
      // private browsing or storage blocked
    }
    return DEFAULT_LANGUAGE;
  }

  private persistLanguage(lang: SupportedLanguage): void {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // private browsing or storage blocked
    }
  }
}
