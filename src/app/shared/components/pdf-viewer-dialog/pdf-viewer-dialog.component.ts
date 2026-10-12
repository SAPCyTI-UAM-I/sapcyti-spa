import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';

import { LoadStateComponent } from '../load-state/load-state.component';

const MIN_ZOOM = 75;
const MAX_ZOOM = 200;
const ZOOM_STEP = 25;
const DEFAULT_ZOOM = 100;

@Component({
  selector: 'app-pdf-viewer-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, Button, Dialog, LoadStateComponent],
  templateUrl: './pdf-viewer-dialog.component.html',
})
export class PdfViewerDialogComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);
  private boundBlob: Blob | null = null;
  private rawUrl: string | null = null;
  private wasOpen = false;
  private restoreTarget: HTMLElement | null = null;

  readonly visible = input(false);
  readonly blob = input<Blob | null>(null);
  readonly fileName = input<string | null>(null);
  readonly loading = input(false);
  readonly errorKey = input<string | null>(null);

  readonly visibleChange = output<boolean>();
  readonly download = output<void>();
  readonly retry = output<void>();

  /**
   * URL local del Blob, marcada solo para el atributo data del object.
   * Se revoca al cerrar, sustituir o destruir. No es HTML del PDF.
   */
  readonly blobUrl = signal<SafeResourceUrl | null>(null);
  readonly zoom = signal(DEFAULT_ZOOM);
  readonly renderFailed = signal(false);

  readonly minZoom = MIN_ZOOM;
  readonly maxZoom = MAX_ZOOM;

  constructor() {
    effect(() => {
      const open = this.visible();
      const blob = this.blob();
      untracked(() => this.syncViewer(open, blob));
    });

    this.destroyRef.onDestroy(() => {
      this.releaseObjectUrl();
      this.restoreFocus();
    });
  }

  onVisibleChange(open: boolean): void {
    this.visibleChange.emit(open);
  }

  requestDownload(): void {
    this.download.emit();
  }

  zoomIn(): void {
    this.zoom.update((level) => Math.min(MAX_ZOOM, level + ZOOM_STEP));
  }

  zoomOut(): void {
    this.zoom.update((level) => Math.max(MIN_ZOOM, level - ZOOM_STEP));
  }

  resetZoom(): void {
    this.zoom.set(DEFAULT_ZOOM);
  }

  /** El visor nativo no pudo pintar el PDF; el texto es una clave i18n. */
  onObjectError(): void {
    this.renderFailed.set(true);
  }

  viewerErrorKey(): string {
    return this.errorKey() ?? 'EXAM_REQUEST.VIEWER.RENDER_ERROR';
  }

  private syncViewer(open: boolean, blob: Blob | null): void {
    if (open && !this.wasOpen) {
      this.captureFocus();
    }

    if (!open && this.wasOpen) {
      this.releaseObjectUrl();
      this.zoom.set(DEFAULT_ZOOM);
      this.renderFailed.set(false);
      this.restoreFocus();
    }

    this.wasOpen = open;
    if (open) {
      this.replaceObjectUrl(blob);
    }
  }

  private replaceObjectUrl(blob: Blob | null): void {
    if (blob === this.boundBlob && (blob === null || this.rawUrl !== null)) {
      return;
    }

    this.releaseObjectUrl();
    this.renderFailed.set(false);
    this.boundBlob = blob;
    if (!blob) {
      return;
    }

    // Solo se confía la URL blob: creada aquí, para poder asignarla a <object data>.
    const url = URL.createObjectURL(blob);
    this.rawUrl = url;
    this.blobUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  private releaseObjectUrl(): void {
    if (this.rawUrl) {
      URL.revokeObjectURL(this.rawUrl);
      this.rawUrl = null;
      this.blobUrl.set(null);
    }
    this.boundBlob = null;
  }

  private captureFocus(): void {
    if (this.restoreTarget) {
      return;
    }

    const active = document.activeElement;
    this.restoreTarget = active instanceof HTMLElement ? active : null;
  }

  private restoreFocus(): void {
    const target = this.restoreTarget;
    this.restoreTarget = null;
    queueMicrotask(() => target?.focus());
  }
}
