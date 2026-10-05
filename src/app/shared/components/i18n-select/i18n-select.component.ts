import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Select } from 'primeng/select';

/** Option shape for {@link I18nSelectComponent}: the label is an i18n key. */
export interface I18nSelectOption<T = unknown> {
  readonly labelKey: string;
  readonly value: T;
}

interface TranslatedOption {
  readonly label: string;
  readonly value: unknown;
}

/**
 * Wraps `p-select` for the common case of options whose label is an i18n key.
 * The keys are translated into an `optionLabel` so PrimeNG uses real text both
 * visually AND for the accessible name (a custom `#item` template only styles
 * the visual side, leaving each option's aria-name as the stringified object).
 * Labels re-translate on language change — same pattern as `user-menu`/`breadcrumb`.
 * Reuses the parent `FormGroupDirective` so callers keep using `controlName`.
 */
@Component({
  selector: 'app-i18n-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Select],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
  template: `
    <p-select
      [formControlName]="controlName()"
      [inputId]="inputId()"
      [options]="translatedOptions()"
      optionLabel="label"
      optionValue="value"
      [placeholder]="placeholder()"
      [showClear]="showClear()"
      [fluid]="fluid()"
      [loading]="loading()"
      [disabled]="disabled()"
    />
  `,
})
export class I18nSelectComponent {
  private readonly translate = inject(TranslateService);
  /** Ticks on language change so the labels below re-translate. */
  private readonly lang = toSignal(this.translate.onLangChange, { initialValue: null });

  readonly controlName = input.required<string>();
  readonly options = input.required<I18nSelectOption[]>();
  readonly inputId = input<string>();
  readonly placeholder = input<string>();
  readonly fluid = input(true);
  readonly showClear = input(false);
  readonly loading = input(false);
  readonly disabled = input(false);

  readonly translatedOptions = computed<TranslatedOption[]>(() => {
    this.lang();
    return this.options().map((option) => ({
      label: this.translate.instant(option.labelKey),
      value: option.value,
    }));
  });
}
