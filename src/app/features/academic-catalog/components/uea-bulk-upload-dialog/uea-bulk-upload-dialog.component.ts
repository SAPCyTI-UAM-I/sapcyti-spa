import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Message } from 'primeng/message';
import { finalize } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import { UeaBulkUploadResult, BulkErrorCode } from '../../../../models';
import { UeaService } from '../../services/uea.service';
import { CATALOG_ERROR_I18N_SCOPE } from '../../utils/catalog-error.util';
import { UeaError, mapUeaError } from '../../utils/uea-error.util';
import type { I18nKey } from '../../../../core/i18n/i18n-keys.generated';

@Component({
  selector: 'app-uea-bulk-upload-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, Button, Dialog, Message, DomainErrorMessagePipe],
  templateUrl: './uea-bulk-upload-dialog.component.html',
})
export class UeaBulkUploadDialogComponent {
  private readonly service = inject(UeaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly uploaded = output<void>();

  readonly visible = signal(false);
  readonly bulkLoading = signal(false);
  readonly bulkResult = signal<UeaBulkUploadResult | null>(null);
  readonly bulkError = signal<UeaError | null>(null);
  readonly selectedFile = signal<File | null>(null);

  readonly catalogErrorScope = CATALOG_ERROR_I18N_SCOPE;

  open(): void {
    this.bulkResult.set(null);
    this.bulkError.set(null);
    this.selectedFile.set(null);
    this.visible.set(true);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
    this.bulkResult.set(null);
    this.bulkError.set(null);
  }

  uploadBulk(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.bulkLoading.set(true);
    this.bulkError.set(null);
    this.bulkResult.set(null);

    this.service
      .bulkUploadUeas(file)
      .pipe(
        finalize(() => this.bulkLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.bulkResult.set(result);
          if (result.created > 0) {
            this.uploaded.emit();
          }
        },
        error: (error) => this.bulkError.set(mapUeaError(error)),
      });
  }

  bulkErrorLabel(code: BulkErrorCode): I18nKey {
    return `ACADEMIC_CATALOG.UEAS.BULK.ERRORS.${code}` as I18nKey;
  }
}
