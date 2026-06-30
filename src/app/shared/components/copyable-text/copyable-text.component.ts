import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Tooltip } from 'primeng/tooltip';

import { copyTextToClipboard } from '../../utils/clipboard.util';
import { TOAST_LIFE } from '../../utils/toast.util';

@Component({
  selector: 'app-copyable-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline min-w-0',
  },
  imports: [TranslatePipe, Tooltip],
  template: `
    <span
      class="hover:text-primary cursor-pointer transition-colors"
      role="button"
      tabindex="0"
      [attr.aria-label]="'COMMON.CLIPBOARD.COPY' | translate"
      [pTooltip]="'COMMON.CLIPBOARD.COPY' | translate"
      tooltipPosition="top"
      (click)="copy()"
      (keydown.enter)="copy()"
      (keydown.space)="$event.preventDefault(); copy()"
    >
      <ng-content />
    </span>
  `,
})
export class CopyableTextComponent {
  readonly value = input.required<string>();

  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);

  copy(): void {
    void copyTextToClipboard(this.value()).then((copied) => {
      if (!copied) {
        return;
      }

      this.messages.add({
        severity: 'success',
        summary: this.translate.instant('COMMON.CLIPBOARD.COPIED'),
        life: TOAST_LIFE.BRIEF,
      });
    });
  }
}
