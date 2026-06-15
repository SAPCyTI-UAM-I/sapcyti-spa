import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Tooltip } from 'primeng/tooltip';

import { copyTextToClipboard } from '../../utils/clipboard.util';

@Component({
  selector: 'app-temporary-password-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, Button, Dialog, Tooltip],
  template: `
    <p-dialog
      [visible]="visible()"
      [modal]="true"
      [closable]="false"
      [style]="{ width: 'min(26rem, calc(100vw - 2rem))' }"
      [header]="'ACADEMIC_CATALOG.TEMP_PASSWORD.TITLE' | translate"
    >
      <div class="gap-md py-md flex flex-col">
        <div class="text-success gap-sm flex items-center">
          <i class="pi pi-check-circle text-[24px]" aria-hidden="true"></i>
          <strong>{{ 'ACADEMIC_CATALOG.TEMP_PASSWORD.SUBTITLE' | translate }}</strong>
        </div>
        <p class="text-body-md text-text-secondary">
          {{ 'ACADEMIC_CATALOG.TEMP_PASSWORD.MESSAGE' | translate }}
        </p>
        <!-- The whole field is clickable to copy faster. -->
        <div
          class="bg-surface-subtle border-outline hover:border-primary gap-md p-md relative flex cursor-pointer items-center justify-between rounded-lg border transition-colors"
          role="button"
          tabindex="0"
          [attr.aria-label]="'ACADEMIC_CATALOG.TEMP_PASSWORD.COPY' | translate"
          [pTooltip]="'ACADEMIC_CATALOG.TEMP_PASSWORD.COPY' | translate"
          tooltipPosition="top"
          (click)="copyPassword()"
          (keydown.enter)="copyPassword()"
          (keydown.space)="$event.preventDefault(); copyPassword()"
        >
          <span
            data-testid="generated-password"
            class="text-h3 font-mono font-bold tracking-wider"
            [textContent]="password()"
          ></span>
          <i
            class="pi pi-copy copy-icon copy-attention text-text-secondary"
            [class.copy-pop]="pop()"
            aria-hidden="true"
          ></i>
        </div>
        <p class="text-caption text-error font-semibold">
          {{ 'ACADEMIC_CATALOG.TEMP_PASSWORD.WARNING' | translate }}
        </p>
      </div>
      <ng-template #footer>
        <p-button
          data-testid="close-password-dialog"
          [label]="'ACADEMIC_CATALOG.TEMP_PASSWORD.CLOSE' | translate"
          (onClick)="closed.emit()"
        />
      </ng-template>
    </p-dialog>
  `,
})
export class TemporaryPasswordDialogComponent {
  readonly visible = input(false);
  readonly password = input('');
  readonly copied = input(false);
  readonly copiedChange = output<boolean>();
  readonly closed = output<void>();
  readonly pop = signal(false);

  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);

  copyPassword(): void {
    void copyTextToClipboard(this.password()).then((copied) => {
      if (!copied) {
        return;
      }
      this.copiedChange.emit(true);
      this.playCopyFeedback();
    });
  }

  private playCopyFeedback(): void {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(40);
    }
    // Restart the pop animation even on rapid repeated clicks: drop the class,
    // then re-add it on the next frame.
    this.pop.set(false);
    requestAnimationFrame(() => {
      this.pop.set(true);
      setTimeout(() => this.pop.set(false), 250);
    });

    // Reusable PrimeNG toast (success = green) instead of a bespoke popup.
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant('ACADEMIC_CATALOG.TEMP_PASSWORD.COPIED'),
      life: 1600,
    });
  }
}
