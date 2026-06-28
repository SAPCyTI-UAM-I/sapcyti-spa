import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

import { copyTextToClipboard } from '../../utils/clipboard.util';
import { CopyableTextComponent } from './copyable-text.component';

vi.mock('../../utils/clipboard.util', () => ({
  copyTextToClipboard: vi.fn(() => Promise.resolve(true)),
}));

@Component({
  imports: [CopyableTextComponent],
  template: `<app-copyable-text [value]="value">{{ value }}</app-copyable-text>`,
})
class HostComponent {
  value = '5512345678';
}

describe('CopyableTextComponent', () => {
  async function render() {
    const messageService = { add: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [HostComponent, TranslateModule.forRoot()],
      providers: [{ provide: MessageService, useValue: messageService }],
    }).compileComponents();

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return { fixture, messageService };
  }

  it('shows pointer cursor affordance on the clickable text', async () => {
    const { fixture } = await render();
    const button = fixture.debugElement.query(By.css('[role="button"]'));
    expect(button.nativeElement.className).toContain('cursor-pointer');
  });

  it('copies the bound value when clicked', async () => {
    const { fixture, messageService } = await render();
    const button = fixture.debugElement.query(By.css('[role="button"]'));

    button.nativeElement.click();
    await Promise.resolve();

    expect(copyTextToClipboard).toHaveBeenCalledWith('5512345678');
    expect(messageService.add).toHaveBeenCalled();
  });
});
