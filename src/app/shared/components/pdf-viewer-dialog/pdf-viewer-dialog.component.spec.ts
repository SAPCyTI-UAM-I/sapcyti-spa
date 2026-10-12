import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

import { PdfViewerDialogComponent } from './pdf-viewer-dialog.component';

const RAW_BACKEND_MESSAGE = 'Document not found in bucket/private/key';

describe('PdfViewerDialogComponent', () => {
  let fixture: ComponentFixture<PdfViewerDialogComponent>;
  let createObjectUrl: ReturnType<typeof vi.spyOn>;
  let revokeObjectUrl: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:pdf-viewer');
    revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [PdfViewerDialogComponent, TranslateModule.forRoot(), NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PdfViewerDialogComponent);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function open(blob: Blob | null = new Blob(['%PDF-'], { type: 'application/pdf' })): void {
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('blob', blob);
    fixture.componentRef.setInput('fileName', 'Tesis_Mtria_Garcia_Ruiz_Maria.pdf');
    fixture.detectChanges();
  }

  function closeFromDialog(): void {
    const closed = vi.fn();
    fixture.componentInstance.visibleChange.subscribe(closed);
    fixture.componentInstance.onVisibleChange(false);
    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();
    expect(closed).toHaveBeenCalledWith(false);
  }

  it('opens the dialog, shows the object URL and emits download', () => {
    const downloaded = vi.fn();
    fixture.componentInstance.download.subscribe(downloaded);
    open();

    expect(document.querySelector('[data-testid="pdf-viewer-dialog"]')).toBeTruthy();
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    const objectEl = document.querySelector(
      '[data-testid="pdf-viewer-object"]',
    ) as HTMLObjectElement | null;
    expect(objectEl?.data || objectEl?.getAttribute('data')).toContain('blob:pdf-viewer');
    expect(document.querySelector('[data-testid="pdf-viewer-file-name"]')?.textContent).toContain(
      'Tesis_Mtria_Garcia_Ruiz_Maria.pdf',
    );

    fixture.debugElement
      .query(By.css('[data-testid="pdf-viewer-download"]'))
      .triggerEventHandler('onClick', null);

    expect(downloaded).toHaveBeenCalledTimes(1);
  });

  it('revokes the object URL when the dialog closes and when the blob changes', () => {
    open();
    expect(revokeObjectUrl).not.toHaveBeenCalled();

    closeFromDialog();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:pdf-viewer');
    expect(fixture.componentInstance.blobUrl()).toBeNull();

    createObjectUrl.mockReturnValue('blob:pdf-next');
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('blob', new Blob(['%PDF-2'], { type: 'application/pdf' }));
    fixture.detectChanges();
    const reopened = document.querySelector(
      '[data-testid="pdf-viewer-object"]',
    ) as HTMLObjectElement | null;
    expect(reopened?.data ?? reopened?.getAttribute('data')).toContain('blob:pdf-next');

    fixture.componentRef.setInput('blob', new Blob(['%PDF-3'], { type: 'application/pdf' }));
    fixture.detectChanges();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:pdf-next');
  });

  it('restores focus to the opener when the dialog closes', async () => {
    const opener = document.createElement('button');
    opener.type = 'button';
    document.body.appendChild(opener);
    opener.focus();

    open();
    closeFromDialog();
    await Promise.resolve();

    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('zooms with CSS between 75 and 200 and resets to 100', () => {
    open();

    const zoomIn = fixture.debugElement.query(By.css('[data-testid="pdf-viewer-zoom-in"]'));
    const zoomOut = fixture.debugElement.query(By.css('[data-testid="pdf-viewer-zoom-out"]'));
    const zoomReset = fixture.debugElement.query(By.css('[data-testid="pdf-viewer-zoom-reset"]'));

    for (let step = 0; step < 6; step += 1) {
      zoomIn.triggerEventHandler('onClick', null);
    }
    fixture.detectChanges();
    expect(fixture.componentInstance.zoom()).toBe(200);
    expect(zoomIn.componentInstance.disabled).toBe(true);

    zoomOut.triggerEventHandler('onClick', null);
    fixture.detectChanges();
    expect(fixture.componentInstance.zoom()).toBe(175);

    zoomReset.triggerEventHandler('onClick', null);
    fixture.detectChanges();
    expect(fixture.componentInstance.zoom()).toBe(100);
    expect(document.querySelector('[data-testid="pdf-viewer-zoom"]')?.textContent).toContain(
      'EXAM_REQUEST.VIEWER.ZOOM',
    );
  });

  it('shows the translated error key and never the raw backend message', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('errorKey', 'EXAM_REQUEST.ERRORS.document_not_found');
    fixture.detectChanges();

    expect(document.body.textContent).toContain('EXAM_REQUEST.ERRORS.document_not_found');
    expect(document.body.textContent).not.toContain(RAW_BACKEND_MESSAGE);
    expect(document.querySelector('[data-testid="pdf-viewer-object"]')).toBeNull();
  });

  it('emits retry from the load state and revokes the URL on destroy', () => {
    const retried = vi.fn();
    fixture.componentInstance.retry.subscribe(retried);
    open();

    fixture.componentRef.setInput('errorKey', 'EXAM_REQUEST.VIEWER.RENDER_ERROR');
    fixture.detectChanges();

    fixture.debugElement
      .query(By.css('app-load-state'))
      .query(By.css('p-button'))
      .triggerEventHandler('onClick', null);
    expect(retried).toHaveBeenCalledTimes(1);

    fixture.destroy();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:pdf-viewer');
  });
});
