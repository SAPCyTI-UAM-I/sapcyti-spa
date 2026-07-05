import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { I18nSelectComponent, type I18nSelectOption } from './i18n-select.component';

@Component({
  imports: [ReactiveFormsModule, I18nSelectComponent],
  template: `
    <form [formGroup]="form">
      <app-i18n-select controlName="status" [options]="options" />
    </form>
  `,
})
class HostComponent {
  readonly form = new FormGroup({ status: new FormControl('true') });
  readonly options: I18nSelectOption[] = [
    { labelKey: 'S.ACTIVE', value: 'true' },
    { labelKey: 'S.INACTIVE', value: 'false' },
  ];
}

describe('I18nSelectComponent', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [HostComponent, TranslateModule.forRoot(), NoopAnimationsModule],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', { S: { ACTIVE: 'Activo', INACTIVE: 'Inactivo' } });
    translate.setTranslation('en', { S: { ACTIVE: 'Active', INACTIVE: 'Inactive' } });
    translate.use('es');

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const select = fixture.debugElement.query(By.directive(I18nSelectComponent))
      .componentInstance as I18nSelectComponent;
    return { fixture, translate, select };
  }

  it('translates the option keys into a real label (for display + accessible name)', async () => {
    const { select } = await setup();
    expect(select.translatedOptions()).toEqual([
      { label: 'Activo', value: 'true' },
      { label: 'Inactivo', value: 'false' },
    ]);
  });

  it('re-translates the labels when the language changes', async () => {
    const { fixture, translate, select } = await setup();

    translate.use('en');
    fixture.detectChanges();

    expect(select.translatedOptions()).toEqual([
      { label: 'Active', value: 'true' },
      { label: 'Inactive', value: 'false' },
    ]);
  });
});
