import { TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { FieldErrorComponent } from './field-error.component';

describe('FieldErrorComponent', () => {
  async function render(key = 'MIN') {
    await TestBed.configureTestingModule({
      imports: [FieldErrorComponent, TranslateModule.forRoot()],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', { MIN: 'Faltan {{remaining}}.' });
    translate.use('es');

    const fixture = TestBed.createComponent(FieldErrorComponent);
    const control = new FormControl('', [Validators.required, Validators.minLength(8)]);
    control.markAsDirty();
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('minLengthRemainingKey', key);
    fixture.autoDetectChanges();
    await fixture.whenStable();

    return { fixture, control, text: () => (fixture.nativeElement.textContent ?? '').trim() };
  }

  it('updates the remaining-characters message live as the value changes (zoneless, no manual CD)', async () => {
    const { fixture, control, text } = await render();

    control.setValue('abcd'); // 4 chars -> 4 remaining
    await fixture.whenStable();
    expect(text()).toContain('Faltan 4.');

    control.setValue('abcdefg'); // 7 chars -> 1 remaining
    await fixture.whenStable();
    expect(text()).toContain('Faltan 1.');

    control.setValue('abcdefgh'); // 8 chars -> valid, message gone
    await fixture.whenStable();
    expect(text()).toBe('');
  });
});
