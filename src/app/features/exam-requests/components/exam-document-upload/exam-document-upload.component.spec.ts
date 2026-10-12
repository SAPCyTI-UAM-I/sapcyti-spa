import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

import type { ExamRequirementDto } from '../../../../models';
import {
  ExamDocumentUploadComponent,
  type ExamDocumentSelection,
} from './exam-document-upload.component';

const EMANUEL_THESIS = 'Tesis_Mtria_Lopez_Alba_Emanuel.pdf';
const PDF_HEADER = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

function thesisRequirement(): ExamRequirementDto {
  return {
    documentType: 'TESIS',
    required: true,
    acceptedKinds: ['PDF'],
    expectedName: EMANUEL_THESIS,
    exampleName: EMANUEL_THESIS,
    status: 'PENDIENTE',
    currentDocument: null,
  };
}

function articleRequirement(): ExamRequirementDto {
  return {
    documentType: 'ARTICULO',
    required: true,
    acceptedKinds: ['PDF', 'URL'],
    expectedName: null,
    exampleName: null,
    status: 'PENDIENTE',
    currentDocument: null,
  };
}

function pdfFile(name: string): File {
  return new File([PDF_HEADER], name, { type: 'application/octet-stream' });
}

function fileListOf(files: readonly File[]): FileList {
  const list = {
    length: files.length,
    item: (index: number) => files[index] ?? null,
    *[Symbol.iterator]() {
      yield* files;
    },
  };
  files.forEach((file, index) => {
    Object.defineProperty(list, index, { value: file });
  });
  return list as unknown as FileList;
}

describe('ExamDocumentUploadComponent', () => {
  async function setup(requirement: ExamRequirementDto = thesisRequirement(), disabled = false) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ExamDocumentUploadComponent, TranslateModule.forRoot(), NoopAnimationsModule],
    }).compileComponents();

    const fixture = TestBed.createComponent(ExamDocumentUploadComponent);
    fixture.componentRef.setInput('requirement', requirement);
    fixture.componentRef.setInput('disabled', disabled);

    const emissions: (ExamDocumentSelection | null)[] = [];
    fixture.componentInstance.selectionChange.subscribe((value) => emissions.push(value));
    fixture.detectChanges();

    return { fixture, emissions };
  }

  async function flushValidation(
    fixture: ReturnType<typeof TestBed.createComponent<ExamDocumentUploadComponent>>,
  ): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function dropFiles(
    fixture: ReturnType<typeof TestBed.createComponent<ExamDocumentUploadComponent>>,
    files: readonly File[],
  ): void {
    const zone = fixture.debugElement.query(By.css('[data-testid="exam-document-dropzone"]'));
    const event = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'dataTransfer', { value: { files: fileListOf(files) } });
    zone.triggerEventHandler('drop', event);
  }

  function chooseFiles(
    fixture: ReturnType<typeof TestBed.createComponent<ExamDocumentUploadComponent>>,
    files: readonly File[],
  ): void {
    const input = fixture.nativeElement.querySelector(
      '[data-testid="exam-document-file"]',
    ) as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: fileListOf(files) });
    input.dispatchEvent(new Event('change'));
  }

  it('accepts a valid PDF from drag and drop and from the file input', async () => {
    const { fixture, emissions } = await setup();
    const first = pdfFile(EMANUEL_THESIS);

    dropFiles(fixture, [first]);
    await flushValidation(fixture);

    expect(emissions).toEqual([{ documentType: 'TESIS', kind: 'PDF', file: first }]);
    expect(fixture.nativeElement.querySelector('[data-testid="exam-article-kind"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="exam-document-ready"]')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('[data-testid="exam-document-selected"]').textContent,
    ).toContain(EMANUEL_THESIS);

    const second = pdfFile(EMANUEL_THESIS);
    chooseFiles(fixture, [second]);
    await flushValidation(fixture);

    expect(emissions.at(-1)).toEqual({ documentType: 'TESIS', kind: 'PDF', file: second });
  });

  it('replaces a previous valid local selection with another valid file', async () => {
    const { fixture, emissions } = await setup();
    const first = pdfFile(EMANUEL_THESIS);
    const replacement = pdfFile('TESIS_MTRIA_LOPEZ_ALBA_EMANUEL.PDF');

    dropFiles(fixture, [first]);
    await flushValidation(fixture);
    dropFiles(fixture, [replacement]);
    await flushValidation(fixture);

    expect(emissions).toEqual([
      { documentType: 'TESIS', kind: 'PDF', file: first },
      { documentType: 'TESIS', kind: 'PDF', file: replacement },
    ]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="exam-document-selected"]').textContent,
    ).toContain(replacement.name);
  });

  it('rejects several files at once and keeps the previous valid selection', async () => {
    const { fixture, emissions } = await setup();
    const valid = pdfFile(EMANUEL_THESIS);

    dropFiles(fixture, [valid]);
    await flushValidation(fixture);
    dropFiles(fixture, [pdfFile(EMANUEL_THESIS), pdfFile('otra.pdf')]);
    await flushValidation(fixture);

    expect(emissions).toEqual([{ documentType: 'TESIS', kind: 'PDF', file: valid }]);
    const kept = fixture.componentInstance.pendingSelection();
    expect(kept?.kind).toBe('PDF');
    expect(kept?.kind === 'PDF' ? kept.file : null).toBe(valid);
    expect(
      fixture.nativeElement.querySelector('[data-testid="exam-document-error"]').textContent,
    ).toContain('EXAM_REQUEST.UPLOAD.SINGLE_FILE_ONLY');
  });

  it('shows the article PDF/URL selector and clears only that local selection on switch', async () => {
    const { fixture, emissions } = await setup(articleRequirement());
    expect(fixture.nativeElement.querySelector('[data-testid="exam-article-kind"]')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('[data-testid="exam-document-dropzone"]'),
    ).toBeTruthy();

    const paper = pdfFile('paper-final.pdf');
    dropFiles(fixture, [paper]);
    await flushValidation(fixture);
    expect(emissions).toEqual([{ documentType: 'ARTICULO', kind: 'PDF', file: paper }]);

    fixture.componentInstance.kindForm.controls.kind.setValue('URL');
    fixture.detectChanges();

    expect(emissions.at(-1)).toBeNull();
    expect(fixture.componentInstance.pendingSelection()).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="exam-document-dropzone"]'),
    ).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="exam-article-url"]')).toBeTruthy();

    fixture.componentInstance.kindForm.controls.url.setValue(
      'https://revista.ejemplo.org/articulo/123',
    );
    await flushValidation(fixture);

    expect(emissions.at(-1)).toEqual({
      documentType: 'ARTICULO',
      kind: 'URL',
      url: 'https://revista.ejemplo.org/articulo/123',
    });
  });
});
