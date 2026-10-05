import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { BackButtonComponent } from './back-button.component';

describe('BackButtonComponent', () => {
  async function create(
    inputs: Partial<{ routerLink: string | null; tooltip: string; ariaLabel: string }> = {},
  ) {
    await TestBed.configureTestingModule({
      imports: [BackButtonComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(BackButtonComponent);
    if (inputs.routerLink !== undefined) {
      fixture.componentRef.setInput('routerLink', inputs.routerLink);
    }
    if (inputs.tooltip !== undefined) {
      fixture.componentRef.setInput('tooltip', inputs.tooltip);
    }
    if (inputs.ariaLabel !== undefined) {
      fixture.componentRef.setInput('ariaLabel', inputs.ariaLabel);
    }
    fixture.detectChanges();
    return fixture;
  }

  it('renders button with back arrow icon', async () => {
    const fixture = await create();
    const btn = fixture.nativeElement.querySelector('button, a');
    expect(btn).not.toBeNull();
    const icon = fixture.nativeElement.querySelector('.pi-arrow-left');
    expect(icon).not.toBeNull();
  });

  it('emits back event on click', async () => {
    const fixture = await create();
    let emitted = false;
    fixture.componentInstance.back.subscribe(() => {
      emitted = true;
    });

    const btn = fixture.nativeElement.querySelector('button');
    btn?.click();
    expect(emitted).toBe(true);
  });

  it('sets custom tooltip and aria-label when provided', async () => {
    const fixture = await create({ tooltip: 'Volver atrás', ariaLabel: 'Volver atrás' });
    expect(fixture.componentInstance.tooltip()).toBe('Volver atrás');
    expect(fixture.componentInstance.ariaLabel()).toBe('Volver atrás');
  });
});
