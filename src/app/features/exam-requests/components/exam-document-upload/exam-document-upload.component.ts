import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { InputText } from 'primeng/inputtext';

import type { DocumentKind, DocumentType, ExamRequirementDto } from '../../../../models';
import { I18nSelectComponent, type I18nSelectOption } from '../../../../shared/components';
import {
  type DocumentValidationCode,
  type DocumentValidationResult,
  validatePendingDocument,
} from '../../utils/exam-document-validation.util';

export type ExamDocumentSelection =
  | { readonly documentType: DocumentType; readonly kind: 'PDF'; readonly file: File }
  | { readonly documentType: DocumentType; readonly kind: 'URL'; readonly url: string };

interface UploadValidationError {
  readonly code: DocumentValidationCode;
  readonly key: string;
  readonly expectedName?: string;
  readonly params?: { readonly expectedName: string };
}

@Component({
  selector: 'app-exam-document-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslatePipe, InputText, I18nSelectComponent],
  templateUrl: './exam-document-upload.component.html',
})
export class ExamDocumentUploadComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private validationSeq = 0;

  readonly requirement = input.required<ExamRequirementDto>();
  readonly disabled = input(false);
  readonly selectionChange = output<ExamDocumentSelection | null>();

  readonly kindForm = this.fb.group({
    kind: this.fb.control<DocumentKind>('PDF'),
    url: this.fb.control(''),
  });

  readonly kindOptions: I18nSelectOption<DocumentKind>[] = [
    { labelKey: 'EXAM_REQUEST.ARTICLE_KIND.PDF', value: 'PDF' },
    { labelKey: 'EXAM_REQUEST.ARTICLE_KIND.URL', value: 'URL' },
  ];

  readonly selectedKind = toSignal(this.kindForm.controls.kind.valueChanges, {
    initialValue: this.kindForm.controls.kind.value,
  });

  readonly dragging = signal(false);
  readonly pendingSelection = signal<ExamDocumentSelection | null>(null);
  readonly validationError = signal<UploadValidationError | null>(null);

  readonly showKindSelector = computed(() => {
    const requirement = this.requirement();
    return requirement.documentType === 'ARTICULO' && requirement.acceptedKinds.includes('URL');
  });

  readonly fileInputId = computed(() => `exam-document-file-${this.requirement().documentType}`);
  readonly kindInputId = computed(() => `exam-article-kind-${this.requirement().documentType}`);
  readonly urlInputId = computed(() => `exam-article-url-${this.requirement().documentType}`);
  readonly errorId = computed(() => `exam-document-error-${this.requirement().documentType}`);

  constructor() {
    effect(() => {
      const isDisabled = this.disabled();
      untracked(() => {
        if (isDisabled) {
          this.kindForm.disable({ emitEvent: false });
        } else {
          this.kindForm.enable({ emitEvent: false });
        }
      });
    });

    this.kindForm.controls.kind.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onKindChange());

    this.kindForm.controls.url.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((url) => {
        void this.onUrlInput(url);
      });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.cannotAcceptPdf()) {
      return;
    }

    this.dragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (this.cannotAcceptPdf()) {
      return;
    }

    void this.applyFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  onDropZoneKeydown(event: KeyboardEvent): void {
    if (this.cannotAcceptPdf()) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openFilePicker();
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (this.cannotAcceptPdf() || files.length === 0) {
      return;
    }

    void this.applyFiles(files);
  }

  openFilePicker(): void {
    if (this.cannotAcceptPdf()) {
      return;
    }

    this.fileInput()?.nativeElement.click();
  }

  /** Arrastre e input de archivo pasan por la misma validación local. */
  async applyFiles(files: readonly File[]): Promise<void> {
    if (this.cannotAcceptPdf()) {
      return;
    }

    const requirement = this.requirement();
    const seq = ++this.validationSeq;
    const result = await validatePendingDocument({
      files,
      documentType: requirement.documentType,
      expectedName: requirement.expectedName,
      acceptedKinds: requirement.acceptedKinds,
      kind: 'PDF',
    });

    if (seq !== this.validationSeq) {
      return;
    }

    if (!result.ok) {
      this.validationError.set(toUploadError(result));
      return;
    }

    const [file] = files;
    if (!file) {
      return;
    }

    const selection: ExamDocumentSelection = {
      documentType: requirement.documentType,
      kind: 'PDF',
      file,
    };
    this.validationError.set(null);
    this.pendingSelection.set(selection);
    this.selectionChange.emit(selection);
  }

  private onKindChange(): void {
    this.kindForm.controls.url.reset('', { emitEvent: false });
    this.resetFileInput();
    this.dragging.set(false);
    this.validationError.set(null);
    this.pendingSelection.set(null);
    this.selectionChange.emit(null);
  }

  private async onUrlInput(url: string): Promise<void> {
    if (this.disabled() || this.kindForm.controls.kind.value !== 'URL') {
      return;
    }

    const requirement = this.requirement();
    const seq = ++this.validationSeq;
    const result = await validatePendingDocument({
      files: [],
      url,
      documentType: requirement.documentType,
      expectedName: requirement.expectedName,
      acceptedKinds: requirement.acceptedKinds,
      kind: 'URL',
    });

    if (seq !== this.validationSeq) {
      return;
    }

    if (!result.ok) {
      this.validationError.set(toUploadError(result));
      if (this.pendingSelection() !== null) {
        this.pendingSelection.set(null);
        this.selectionChange.emit(null);
      }
      return;
    }

    const selection: ExamDocumentSelection = {
      documentType: requirement.documentType,
      kind: 'URL',
      url: url.trim(),
    };
    this.validationError.set(null);
    this.pendingSelection.set(selection);
    this.selectionChange.emit(selection);
  }

  private cannotAcceptPdf(): boolean {
    return this.disabled() || this.kindForm.controls.kind.value !== 'PDF';
  }

  private resetFileInput(): void {
    const input = this.fileInput()?.nativeElement;
    if (input) {
      input.value = '';
    }
  }
}

function toUploadError(
  result: Extract<DocumentValidationResult, { ok: false }>,
): UploadValidationError {
  return {
    code: result.code,
    key: validationMessageKey(result.code),
    expectedName: result.expectedName,
    params: result.expectedName ? { expectedName: result.expectedName } : undefined,
  };
}

function validationMessageKey(code: DocumentValidationCode): string {
  if (code === 'SINGLE_FILE_ONLY') {
    return 'EXAM_REQUEST.UPLOAD.SINGLE_FILE_ONLY';
  }

  if (code === 'DOCUMENT_KIND_NOT_ALLOWED') {
    return 'EXAM_REQUEST.VALIDATION.INVALID_ARTICLE_URL';
  }

  return `EXAM_REQUEST.VALIDATION.${code}`;
}
