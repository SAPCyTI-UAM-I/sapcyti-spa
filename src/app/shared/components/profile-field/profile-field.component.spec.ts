import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ProfileFieldComponent } from './profile-field.component';

@Component({
  imports: [ProfileFieldComponent],
  template: `
    <dl>
      <app-profile-field [label]="label">
        <span data-testid="value">{{ value }}</span>
      </app-profile-field>
    </dl>
  `,
})
class HostComponent {
  label = 'Nacionalidad';
  value = 'Mexicana';
}

describe('ProfileFieldComponent', () => {
  async function render() {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the label in the term element', async () => {
    const fixture = await render();
    const term = fixture.debugElement.query(By.css('dt'));
    expect(term.nativeElement.textContent).toContain('Nacionalidad');
  });

  it('projects the value content into the description element', async () => {
    const fixture = await render();
    const value = fixture.debugElement.query(By.css('dd [data-testid="value"]'));
    expect(value.nativeElement.textContent).toContain('Mexicana');
  });
});
