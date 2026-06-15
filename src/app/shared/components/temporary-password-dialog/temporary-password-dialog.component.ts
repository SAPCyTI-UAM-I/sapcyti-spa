import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
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
      [style]="{ width: 'min(32rem, calc(100vw - 2rem))' }"
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
        <div
          class="bg-surface-subtle border-outline p-md flex items-center justify-between rounded-lg border"
        >
          <span data-testid="generated-password" class="text-h3 font-mono font-bold tracking-wider">
            {{ password() }}
          </span>
          <p-button
            icon="pi pi-copy"
            severity="secondary"
            variant="text"
            [rounded]="true"
            [pTooltip]="'ACADEMIC_CATALOG.TEMP_PASSWORD.COPY' | translate"
            (onClick)="copyPassword()"
          />
        </div>
        <p class="text-caption text-error font-semibold">
          {{ 'ACADEMIC_CATALOG.TEMP_PASSWORD.WARNING' | translate }}
        </p>
        @if (copied()) {
          <p class="text-caption text-success">
            {{ 'ACADEMIC_CATALOG.TEMP_PASSWORD.COPIED' | translate }}
          </p>
        }
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

  copyPassword(): void {
    void copyTextToClipboard(this.password()).then((copied) => {
      if (copied) {
        this.copiedChange.emit(true);
      }
    });
  }
}
