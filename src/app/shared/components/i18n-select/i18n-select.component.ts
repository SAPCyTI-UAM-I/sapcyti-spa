import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Select } from 'primeng/select';

/** Option shape for {@link I18nSelectComponent}: the label is an i18n key. */
export interface I18nSelectOption<T = unknown> {
  readonly labelKey: string;
  readonly value: T;
}

/**
 * Wraps `p-select` for the common case of options whose label is an i18n key,
 * removing the repeated `#selectedItem`/`#item` `| translate` templates from
 * every form. Reuses the parent `FormGroupDirective` so callers keep using
 * `controlName` exactly like a native `formControlName`.
 */
@Component({
  selector: 'app-i18n-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslatePipe, Select],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
  template: `
    <p-select
      [formControlName]="controlName()"
      [inputId]="inputId()"
      [options]="options()"
      optionValue="value"
      [placeholder]="placeholder()"
      [showClear]="showClear()"
      [fluid]="fluid()"
      [loading]="loading()"
      [disabled]="disabled()"
    >
      <ng-template #selectedItem let-option>{{ option?.labelKey | translate }}</ng-template>
      <ng-template #item let-option>{{ option.labelKey | translate }}</ng-template>
    </p-select>
  `,
})
export class I18nSelectComponent {
  readonly controlName = input.required<string>();
  readonly options = input.required<I18nSelectOption[]>();
  readonly inputId = input<string>();
  readonly placeholder = input<string>();
  readonly fluid = input(true);
  readonly showClear = input(false);
  readonly loading = input(false);
  readonly disabled = input(false);
}
