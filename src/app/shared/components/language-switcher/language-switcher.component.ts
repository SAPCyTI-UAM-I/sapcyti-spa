import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

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
    class: 'inline-flex items-center gap-xs text-label-md font-label-md',
    '[class.auth-lang-switcher]': 'variant() === "auth"',
  },
  imports: [],
  template: `
    @for (option of options; track option.value; let last = $last) {
      <button
        type="button"
        class="hover:text-primary transition-colors"
        [class.text-primary]="currentLang() === option.value"
        [class.text-text-secondary]="currentLang() !== option.value"
        [class.font-bold]="currentLang() === option.value"
        (click)="onLanguageChange(option.value)"
      >
        {{ option.label }}
      </button>

      @if (!last) {
        <span class="text-outline-variant">|</span>
      }
    }
  `,
})
export class LanguageSwitcherComponent {
  readonly variant = input<'default' | 'auth'>('default');

  private readonly translate = inject(TranslateService);

  readonly options: LanguageOption[] = [
    { label: 'ES', value: 'es' },
    { label: 'EN', value: 'en' },
  ];

  readonly currentLang = signal<SupportedLanguage>(this.readStoredLanguage());

  constructor() {
    this.applyLanguage(this.currentLang());
  }

  onLanguageChange(lang: SupportedLanguage): void {
    this.applyLanguage(lang);
    this.persistLanguage(lang);
  }

  private applyLanguage(lang: SupportedLanguage): void {
    this.currentLang.set(lang);
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
