import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Message } from 'primeng/message';
import { catchError, EMPTY, finalize, map, Observable, of, Subject, switchMap } from 'rxjs';

import { AuthStateService } from '../../../../core/auth/auth.service';
import {
  Degree,
  DocumentType,
  ExamOptionsDto,
  ExamPanelResponse,
  ExamRequestDto,
  ExamRequirementDto,
  ExamType,
  MutationResponse,
  SaveDocumentsResponse,
} from '../../../../models';
import {
  CatalogTagComponent,
  I18nSelectComponent,
  type I18nSelectOption,
  LoadStateComponent,
} from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { downloadBlob } from '../../../../shared/utils/download.util';
import type { ReplaceDocumentCommand } from '../../repositories/exam-request.repository';
import { ExamRequestService } from '../../services/exam-request.service';
import { degreeTagSeverity } from '../../utils/degree-tag.util';
import { formatDocumentFileSize, formatUploadedAt } from '../../utils/exam-document-format.util';
import {
  localizeDocumentFileName,
  resolveDocumentNameLanguage,
} from '../../utils/exam-document-name.util';
import { isHttpsArticleUrl } from '../../utils/exam-document-validation.util';
import {
  EXAM_REQUEST_ERROR_I18N_SCOPE,
  ExamRequestWriteError,
  mapSaveDocumentItemError,
  type SaveItemErrorView,
} from '../../utils/exam-request-error.util';
import {
  ExamDocumentUploadComponent,
  type ExamDocumentSelection,
} from '../exam-document-upload/exam-document-upload.component';

type LoadTrigger = { kind: 'reload' } | { kind: 'type'; examType: ExamType };

/** Petición de bytes; la autorización es examType + documentType, nunca el id. */
interface DocumentContentRequest {
  readonly examType: ExamType;
  readonly documentType: DocumentType;
  readonly uploadedAt: string;
  readonly epoch: number;
}

type ContentResult =
  | { readonly ok: true; readonly blob: Blob; readonly request: DocumentContentRequest }
  | { readonly ok: false; readonly error: unknown; readonly request: DocumentContentRequest };

/** Blob compartido por visor y consulta de miniatura. objectUrl se revoca al soltar la entrada. */
interface ContentCacheEntry {
  readonly blob: Blob;
  readonly objectUrl: string;
}

@Component({
  selector: 'app-exam-requirements-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    Button,
    Dialog,
    Message,
    CatalogTagComponent,
    I18nSelectComponent,
    LoadStateComponent,
    ExamDocumentUploadComponent,
  ],
  templateUrl: './exam-requirements-list.component.html',
})
export class ExamRequirementsListComponent implements OnInit {
  private readonly examRequests = inject(ExamRequestService);
  private readonly auth = inject(AuthStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly translate = inject(TranslateService);
  private readonly load$ = new Subject<LoadTrigger>();
  private readonly openContent$ = new Subject<DocumentContentRequest | null>();
  private readonly contentCache = new Map<string, ContentCacheEntry>();
  /** Descarta una respuesta si el alumno ya cambió de documento o cerró el visor. */
  private contentEpoch = 0;
  private inflightKey: string | null = null;
  private readonly lang = toSignal(this.translate.onLangChange, { initialValue: null });

  readonly examTypeForm = this.fb.group({
    examType: this.fb.control<ExamType>('GRADO'),
  });

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly options = signal<ExamOptionsDto | null>(null);
  readonly panel = signal<ExamPanelResponse | null>(null);

  /** Queda en el estado para habilitar carga en HU-65. */
  readonly eligible = computed(
    () => this.options()?.eligible === true && this.panel()?.eligible === true,
  );

  readonly degree = computed<Degree | null>(
    () => this.options()?.degree ?? this.panel()?.degree ?? null,
  );

  readonly degreeSeverity = computed(() => {
    const degree = this.degree();
    return degree ? degreeTagSeverity(degree) : 'secondary';
  });

  readonly showIneligible = computed(
    () => this.options() !== null && !this.eligible() && this.loadError() === null,
  );

  readonly visibleRequirements = computed<ExamRequirementDto[]>(() => {
    if (!this.eligible()) {
      return [];
    }

    return this.panel()?.requirements ?? [];
  });

  /** El servidor deriva el contador; no se recalcula en la vista. */
  readonly requiredPendingCount = computed(() => this.panel()?.requiredPendingCount ?? 0);

  readonly eligibilityMessageKey = computed(() => {
    const reason = this.options()?.eligibilityReason ?? this.panel()?.eligibilityReason ?? null;
    if (reason === 'PROGRAM_BAJA') {
      return 'EXAM_REQUEST.ELIGIBILITY.PROGRAM_BAJA';
    }

    if (reason === 'PROGRAM_SUSPENSION') {
      return 'EXAM_REQUEST.ELIGIBILITY.PROGRAM_SUSPENSION';
    }

    return 'EXAM_REQUEST.ERRORS.PROGRAM_NOT_ELIGIBLE';
  });

  readonly errorMessage = computed(() => this.loadError() ?? 'EXAM_REQUEST.STATES.LOAD_ERROR');

  /** Selector solo si el servidor ofrece más de un tipo. */
  readonly showExamTypeSelector = computed(() => (this.options()?.examTypes.length ?? 0) > 1);

  readonly examTypeOptions = computed<I18nSelectOption<ExamType>[]>(() =>
    (this.options()?.examTypes ?? []).map((value) => ({
      labelKey: `EXAM_REQUEST.EXAM_TYPES.${value}`,
      value,
    })),
  );

  readonly requestFolio = computed(() => this.panel()?.request?.folio ?? null);

  /** Selección local por tipo; el POST solo toma tipos sin currentDocument. */
  readonly pendingSelections = signal<Partial<Record<DocumentType, ExamDocumentSelection>>>({});

  /**
   * Habilitación visual de envío: elegible y todos los required en CARGADO.
   * El POST real pertenece a HU-67; este botón no dispara HTTP.
   */
  readonly canSubmit = computed(() => {
    if (!this.eligible()) {
      return false;
    }

    const items = this.panel()?.requirements ?? [];
    const requiredItems = items.filter((item) => item.required);
    return requiredItems.length > 0 && requiredItems.every((item) => item.status === 'CARGADO');
  });

  readonly inFlight = signal(false);
  readonly saveWriteError = signal<string | null>(null);
  readonly itemSaveErrors = signal<Partial<Record<DocumentType, SaveItemErrorView>>>({});
  readonly showSaveDialog = signal(false);
  readonly saveDialogSavedCount = signal(0);
  readonly saveDialogFailed = signal<SaveItemErrorView[]>([]);
  readonly showAllFailed = signal(false);
  private readonly saveErrorSummary = viewChild<ElementRef<HTMLElement>>('saveErrorSummary');

  readonly saveWriteErrorKey = computed(() => {
    const key = this.saveWriteError();
    return key ? `${EXAM_REQUEST_ERROR_I18N_SCOPE}.${key}` : null;
  });

  readonly saveDialogTitleKey = computed(() =>
    this.saveDialogFailed().length > 0 ? 'EXAM_REQUEST.SAVE.MIXED' : 'EXAM_REQUEST.SAVE.SUCCESS',
  );

  /** Aviso por tipo; no incluye message del backend. */
  readonly documentNotices = signal<Partial<Record<DocumentType, string>>>({});

  readonly replacingType = signal<DocumentType | null>(null);
  readonly deleteTarget = signal<DocumentType | null>(null);
  readonly itemReplaceErrors = signal<Partial<Record<DocumentType, ExamRequestWriteError>>>({});

  /** Reemplazo y borrado solo en BORRADOR con documento vigente. */
  readonly canMutateDraft = computed(() => this.panel()?.request?.status === 'BORRADOR');

  readonly showDeleteDialog = computed(() => this.deleteTarget() !== null);

  readonly deleteTypeName = computed(() => {
    this.lang();
    const documentType = this.deleteTarget();
    return documentType
      ? this.translate.instant(`EXAM_REQUEST.DOCUMENT_TYPES.${documentType}`)
      : '';
  });

  /** Solo tipos sin documento vigente; el reemplazo usa PUT por tarjeta. */
  readonly saveableSelections = computed<ExamDocumentSelection[]>(() => {
    const items = this.panel()?.requirements ?? [];
    const pending = this.pendingSelections();
    return Object.values(pending).filter((selection): selection is ExamDocumentSelection => {
      if (!selection) {
        return false;
      }

      const item = items.find((requirement) => requirement.documentType === selection.documentType);
      return item?.currentDocument == null;
    });
  });

  readonly canSave = computed(() => {
    if (this.inFlight() || !this.eligible()) {
      return false;
    }

    const request = this.panel()?.request;
    if (request && request.status !== 'BORRADOR') {
      return false;
    }

    return this.saveableSelections().length > 0;
  });

  ngOnInit(): void {
    this.openContent$
      .pipe(
        switchMap((request) => this.fetchInline(request)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (!result || result.request.epoch !== this.contentEpoch) {
          return;
        }

        this.inflightKey = null;
        if (result.ok) {
          this.rememberContent(result.request, result.blob);
          const entry = this.contentCache.get(contentCacheKey(result.request));
          if (entry) {
            this.openPdfTab(entry, result.request.documentType);
          }
          return;
        }

        this.presentContentError(result.error, result.request);
      });

    this.destroyRef.onDestroy(() => {
      this.clearContentCache();
    });

    this.load$
      .pipe(
        switchMap((trigger) => this.loadTrigger(trigger)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((panel) => {
        this.panel.set(panel);
        if (this.options()?.eligible && panel.eligible && panel.requirements.length === 0) {
          this.loadError.set('EXAM_REQUEST.STATES.EMPTY');
        }
      });

    this.examTypeForm.controls.examType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((examType) => {
        this.documentNotices.set({});
        this.closeViewer();
        this.clearPendingSelections();
        this.closeMutationUi();
        this.load$.next({ kind: 'type', examType });
      });

    this.auth.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      if (!user) {
        this.clearAcademicState();
        return;
      }

      this.reload();
    });
  }

  reload(): void {
    this.load$.next({ kind: 'reload' });
  }

  requirementStatusSeverity(status: ExamRequirementDto['status']): 'success' | 'secondary' {
    return status === 'CARGADO' ? 'success' : 'secondary';
  }

  requirementRequiredSeverity(required: boolean): 'warn' | 'secondary' {
    return required ? 'warn' : 'secondary';
  }

  /** El API entrega el prefijo en español; se muestra el alias del idioma activo. */
  localizedFileName(fileName: string | null): string | null {
    this.lang();
    return localizeDocumentFileName(
      fileName,
      resolveDocumentNameLanguage(this.translate.currentLang),
    );
  }

  documentFileSize(sizeBytes: number | null): string | null {
    return formatDocumentFileSize(sizeBytes);
  }

  documentUploadedAt(iso: string): string {
    return formatUploadedAt(iso);
  }

  /** HTTPS con host; null si falta o el esquema no es https. */
  safeArticleUrl(value: string | null): string | null {
    if (!value || !isHttpsArticleUrl(value)) {
      return null;
    }

    return value.trim();
  }

  documentNotice(documentType: DocumentType): string | null {
    return this.documentNotices()[documentType] ?? null;
  }

  /**
   * Blob ya cargado para este PDF. No dispara HTTP: la miniatura visible
   * sigue siendo el aviso accesible.
   */
  previewBlob(item: ExamRequirementDto): Blob | null {
    const document = item.currentDocument;
    if (!document || document.kind !== 'PDF') {
      return null;
    }

    const key = contentCacheKey({
      examType: this.examTypeForm.controls.examType.value,
      documentType: item.documentType,
      uploadedAt: document.uploadedAt,
    });
    return this.contentCache.get(key)?.blob ?? null;
  }

  /**
   * PDF y URL se abren en una pestaña nueva.
   * El PDF usa una blob: URL de la caché; el enlace HTTPS sale de la metadata.
   */
  openSavedDocument(item: ExamRequirementDto, event?: Event): void {
    const document = item.currentDocument;
    if (!document) {
      return;
    }

    if (document.kind === 'URL') {
      this.openExternalDocument(item, event);
      return;
    }

    this.showCachedOrLoad(this.contentRequestFor(item.documentType, document.uploadedAt));
  }

  openExternalDocument(item: ExamRequirementDto, event?: Event): void {
    event?.stopPropagation();
    const url = this.safeArticleUrl(item.currentDocument?.externalUrl ?? null);
    if (!url) {
      event?.preventDefault();
      this.documentNotices.update((current) => ({
        ...current,
        [item.documentType]: 'EXAM_REQUEST.VALIDATION.INVALID_ARTICLE_URL',
      }));
      return;
    }

    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (popup) {
      event?.preventDefault();
    }
  }

  onDocumentKeydown(item: ExamRequirementDto, event: Event): void {
    if (item.currentDocument?.kind !== 'PDF') {
      return;
    }

    event.preventDefault();
    this.openSavedDocument(item);
  }

  onPendingSelectionChange(
    documentType: DocumentType,
    selection: ExamDocumentSelection | null,
  ): void {
    this.pendingSelections.update((current) => {
      const next = { ...current };
      if (!selection) {
        delete next[documentType];
      } else {
        next[documentType] = selection;
      }
      return next;
    });
  }

  saveItemError(documentType: DocumentType): SaveItemErrorView | null {
    return this.itemSaveErrors()[documentType] ?? null;
  }

  closeSaveDialog(): void {
    this.showSaveDialog.set(false);
  }

  canShowDraftActions(item: ExamRequirementDto): boolean {
    return this.canMutateDraft() && item.currentDocument != null;
  }

  isReplacing(documentType: DocumentType): boolean {
    return this.replacingType() === documentType;
  }

  canConfirmReplace(documentType: DocumentType): boolean {
    return (
      this.canMutateDraft() &&
      !this.inFlight() &&
      this.pendingSelections()[documentType] != null &&
      this.panel()?.requirements.find((item) => item.documentType === documentType)
        ?.currentDocument != null
    );
  }

  replaceWriteErrorKey(documentType: DocumentType): string | null {
    const key = this.itemReplaceErrors()[documentType];
    return key ? `${EXAM_REQUEST_ERROR_I18N_SCOPE}.${key}` : null;
  }

  /** Abre o cierra el editor de reemplazo; no dispara HTTP. */
  toggleReplaceEditor(documentType: DocumentType): void {
    if (!this.canMutateDraft() || this.inFlight()) {
      return;
    }

    this.replacingType.update((current) => (current === documentType ? null : documentType));
  }

  askDelete(documentType: DocumentType): void {
    if (!this.canMutateDraft() || this.inFlight()) {
      return;
    }

    const item = this.panel()?.requirements.find(
      (requirement) => requirement.documentType === documentType,
    );
    if (!item?.currentDocument) {
      return;
    }

    this.deleteTarget.set(documentType);
  }

  cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  onDeleteDialogVisibleChange(visible: boolean): void {
    if (!visible) {
      this.cancelDelete();
    }
  }

  /** PUT solo con borrador vigente y selección válida; el fallo conserva el documento anterior. */
  confirmReplace(documentType: DocumentType): void {
    if (!this.canConfirmReplace(documentType)) {
      return;
    }

    const selection = this.pendingSelections()[documentType];
    const version = this.panel()?.request?.version;
    if (!selection || version == null) {
      return;
    }

    const examType = this.examTypeForm.controls.examType.value;
    const command: ReplaceDocumentCommand =
      selection.kind === 'PDF'
        ? { kind: 'PDF', version, file: selection.file }
        : { kind: 'URL', version, externalUrl: selection.url };

    this.inFlight.set(true);
    this.saveWriteError.set(null);
    this.itemReplaceErrors.update((current) => {
      const next = { ...current };
      delete next[documentType];
      return next;
    });

    this.examRequests
      .replaceDocument(examType, documentType, command)
      .pipe(
        finalize(() => this.inFlight.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => this.applyReplaceSuccess(response, documentType),
        error: (error: unknown) => this.handleReplaceFailure(error, examType, documentType),
      });
  }

  /**
   * Optimista a PENDIENTE; 409 restaura la fila y recarga el panel.
   * Cancelar no llega aquí.
   */
  confirmDelete(): void {
    if (this.inFlight() || !this.canMutateDraft()) {
      return;
    }

    const documentType = this.deleteTarget();
    const request = this.panel()?.request;
    if (!documentType || !request) {
      return;
    }

    const examType = this.examTypeForm.controls.examType.value;
    const snapshot = this.panel();
    this.deleteTarget.set(null);
    this.applyOptimisticDelete(documentType);
    this.inFlight.set(true);
    this.saveWriteError.set(null);

    this.examRequests
      .deleteDocument(examType, documentType, { version: request.version })
      .pipe(
        finalize(() => this.inFlight.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => this.applyRequestToPanel(response.request),
        error: (error: unknown) => {
          if (snapshot) {
            this.panel.set(snapshot);
          }
          this.handleDeleteFailure(error, examType);
        },
      });
  }

  /** Un POST por clic; inFlight bloquea el segundo disparo. */
  saveDocuments(): void {
    if (!this.canSave()) {
      return;
    }

    const examType = this.examTypeForm.controls.examType.value;
    const version = this.panel()?.request?.version ?? 0;
    const selections = this.saveableSelections();
    this.inFlight.set(true);
    this.saveWriteError.set(null);
    this.showAllFailed.set(false);
    this.itemSaveErrors.set({});

    this.examRequests
      .saveDocuments(examType, version, selections)
      .pipe(
        finalize(() => this.inFlight.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => this.applySaveResponse(response),
        error: (error: unknown) => this.handleSaveFailure(error, examType),
      });
  }

  private loadTrigger(trigger: LoadTrigger): Observable<ExamPanelResponse> {
    // Cambiar de expediente cancela el Blob en vuelo y suelta la caché anterior.
    this.closeViewer();
    this.clearContentCache();
    this.loading.set(true);
    this.loadError.set(null);
    // Evita pintar tarjetas del expediente anterior mientras llega el nuevo.
    this.panel.set(null);

    const source$ =
      trigger.kind === 'reload' ? this.loadOptionsThenPanel() : this.loadPanel(trigger.examType);

    return source$.pipe(
      finalize(() => this.loading.set(false)),
      catchError((error: unknown) => {
        if (trigger.kind === 'reload') {
          this.options.set(null);
        }
        this.panel.set(null);
        this.loadError.set(`${EXAM_REQUEST_ERROR_I18N_SCOPE}.${this.examRequests.mapError(error)}`);
        return EMPTY;
      }),
    );
  }

  private loadOptionsThenPanel(): Observable<ExamPanelResponse> {
    return this.examRequests.getOptions().pipe(
      switchMap((options) => {
        this.options.set(options);
        const selected = this.resolveExamType(options.examTypes);
        this.examTypeForm.patchValue({ examType: selected }, { emitEvent: false });
        return this.examRequests.getPanel(selected);
      }),
    );
  }

  private loadPanel(examType: ExamType): Observable<ExamPanelResponse> {
    const allowed = this.options()?.examTypes ?? [];
    if (!allowed.includes(examType)) {
      return EMPTY;
    }

    return this.examRequests.getPanel(examType);
  }

  /** Prefiere GRADO si el servidor lo permite; si no, el primer tipo de examTypes. */
  private resolveExamType(examTypes: readonly ExamType[]): ExamType {
    if (examTypes.includes('GRADO')) {
      return 'GRADO';
    }

    return examTypes[0] ?? 'GRADO';
  }

  private applySaveResponse(response: SaveDocumentsResponse): void {
    const failed: SaveItemErrorView[] = [];
    const savedTypes = new Set<DocumentType>();

    for (const result of response.results) {
      if (result.status === 'SAVED') {
        savedTypes.add(result.documentType);
        continue;
      }

      failed.push(mapSaveDocumentItemError(result.documentType, result.error));
    }

    this.pendingSelections.update((current) => {
      const next = { ...current };
      for (const type of savedTypes) {
        delete next[type];
      }
      return next;
    });

    const errors: Partial<Record<DocumentType, SaveItemErrorView>> = {};
    for (const item of failed) {
      errors[item.documentType] = item;
    }
    this.itemSaveErrors.set(errors);

    if (response.request) {
      this.applyRequestToPanel(response.request);
    }

    this.saveDialogSavedCount.set(savedTypes.size);
    this.saveDialogFailed.set(failed);

    if (savedTypes.size > 0) {
      this.showSaveDialog.set(true);
      return;
    }

    // Todos ERROR: no afirmar guardado; enfocar el resumen.
    this.showAllFailed.set(failed.length > 0);
    queueMicrotask(() => this.saveErrorSummary()?.nativeElement.focus());
  }

  private applyRequestToPanel(request: ExamRequestDto): void {
    this.panel.update((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        request,
        requirements: request.requirements,
        requiredPendingCount: request.requirements.filter(
          (item) => item.required && item.status === 'PENDIENTE',
        ).length,
      };
    });
  }

  private handleSaveFailure(error: unknown, examType: ExamType): void {
    const writeKey = this.examRequests.mapWriteError(error);
    if (shouldReconcilePanelAfterSaveError(error)) {
      this.reconcilePanel(examType, writeKey);
      return;
    }

    this.saveWriteError.set(writeKey);
  }

  /** Sustituye currentDocument; no retiene el Blob ni la URL del archivo anterior. */
  private applyReplaceSuccess(response: MutationResponse, documentType: DocumentType): void {
    this.invalidateDocument(this.examTypeForm.controls.examType.value, documentType);
    this.applyRequestToPanel(response.request);
    this.pendingSelections.update((current) => {
      const next = { ...current };
      delete next[documentType];
      return next;
    });
    this.replacingType.set(null);
  }

  private handleReplaceFailure(
    error: unknown,
    examType: ExamType,
    documentType: DocumentType,
  ): void {
    const writeKey = this.examRequests.mapWriteError(error);
    this.assignWriteError(writeKey, documentType);
    if (shouldReconcilePanelAfterSaveError(error)) {
      this.reconcilePanel(examType, writeKey, documentType);
    }
  }

  private handleDeleteFailure(error: unknown, examType: ExamType): void {
    const writeKey = this.examRequests.mapWriteError(error);
    if (shouldReconcilePanelAfterSaveError(error)) {
      this.reconcilePanel(examType, writeKey);
      return;
    }

    this.saveWriteError.set(writeKey);
  }

  private applyOptimisticDelete(documentType: DocumentType): void {
    this.invalidateDocument(this.examTypeForm.controls.examType.value, documentType);
    this.panel.update((current) => {
      if (!current) {
        return current;
      }

      const requirements = current.requirements.map((item) =>
        item.documentType === documentType
          ? { ...item, status: 'PENDIENTE' as const, currentDocument: null }
          : item,
      );

      return {
        ...current,
        requirements,
        requiredPendingCount: requirements.filter(
          (item) => item.required && item.status === 'PENDIENTE',
        ).length,
      };
    });
  }

  private reconcilePanel(
    examType: ExamType,
    writeKey: ExamRequestWriteError,
    documentType?: DocumentType,
  ): void {
    this.examRequests
      .getPanel(examType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (panel) => {
          this.panel.set(panel);
          this.assignWriteError(writeKey, documentType);
        },
        error: () => this.assignWriteError(writeKey, documentType),
      });
  }

  private assignWriteError(writeKey: ExamRequestWriteError, documentType?: DocumentType): void {
    if (documentType) {
      this.itemReplaceErrors.update((current) => ({ ...current, [documentType]: writeKey }));
      return;
    }

    this.saveWriteError.set(writeKey);
  }

  private clearPendingSelections(): void {
    this.pendingSelections.set({});
  }

  private closeMutationUi(): void {
    this.replacingType.set(null);
    this.deleteTarget.set(null);
    this.itemReplaceErrors.set({});
  }

  private clearAcademicState(): void {
    this.clearPendingSelections();
    this.closeMutationUi();
    this.clearContentCache();
    this.closeViewer();
    this.documentNotices.set({});
    this.options.set(null);
    this.panel.set(null);
    this.loadError.set(null);
    this.loading.set(false);
    this.inFlight.set(false);
    this.saveWriteError.set(null);
    this.itemSaveErrors.set({});
    this.showSaveDialog.set(false);
    this.showAllFailed.set(false);
    this.examTypeForm.reset({ examType: 'GRADO' }, { emitEvent: false });
  }

  private contentRequestFor(
    documentType: DocumentType,
    uploadedAt: string,
  ): DocumentContentRequest {
    return {
      examType: this.examTypeForm.controls.examType.value,
      documentType,
      uploadedAt,
      epoch: this.contentEpoch,
    };
  }

  /** Un acierto no pide red. Un fallo deja un solo GET inline en vuelo para esa clave. */
  private showCachedOrLoad(request: DocumentContentRequest): void {
    const key = contentCacheKey(request);
    const cached = this.contentCache.get(key);
    if (cached) {
      this.contentEpoch += 1;
      this.inflightKey = null;
      this.openContent$.next(null);
      this.openPdfTab(cached, request.documentType);
      return;
    }

    if (this.inflightKey === key) {
      return;
    }

    this.beginInlineLoad(request);
  }

  private beginInlineLoad(request: DocumentContentRequest): void {
    this.contentEpoch += 1;
    const next = { ...request, epoch: this.contentEpoch };
    this.inflightKey = contentCacheKey(next);
    this.openContent$.next(next);
  }

  private fetchInline(request: DocumentContentRequest | null): Observable<ContentResult | null> {
    if (!request) {
      return EMPTY;
    }

    return this.examRequests
      .getDocumentContent(request.examType, request.documentType, 'inline')
      .pipe(
        map((blob) => ({ ok: true as const, blob, request })),
        catchError((error: unknown) => of({ ok: false as const, error, request })),
      );
  }

  private rememberContent(request: DocumentContentRequest, blob: Blob): void {
    const key = contentCacheKey(request);
    const previous = this.contentCache.get(key);
    if (previous?.blob === blob) {
      return;
    }

    if (previous) {
      this.releaseEntry(previous);
    }

    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
    this.contentCache.set(key, { blob: pdfBlob, objectUrl: URL.createObjectURL(pdfBlob) });
  }

  /**
   * Abre el PDF tipado. Si el navegador bloquea la pestaña, descarga el mismo Blob.
   * La blob: URL se revoca al reemplazar, borrar, cambiar de expediente, cerrar sesión
   * o destruir el componente.
   */
  private openPdfTab(entry: ContentCacheEntry, documentType: DocumentType): void {
    this.documentNotices.update((current) => {
      if (!(documentType in current)) {
        return current;
      }
      const next = { ...current };
      delete next[documentType];
      return next;
    });

    // noopener haría que window.open devolviera null aunque la pestaña abriera,
    // y la descarga se dispararía siempre. Se anula opener después de abrir.
    const popup = window.open(entry.objectUrl, '_blank');
    if (!popup) {
      downloadBlob(entry.blob, this.pdfDownloadName(documentType));
      return;
    }

    popup.opener = null;
  }

  private pdfDownloadName(documentType: DocumentType): string {
    const original = this.panel()?.requirements.find((item) => item.documentType === documentType)
      ?.currentDocument?.originalName;
    const base = (original ?? '').replaceAll('\\', '/').split('/').pop()?.trim() ?? '';
    if (!base || base === '.' || base === '..') {
      return 'document.pdf';
    }

    return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
  }

  /**
   * 404 cierra el Blob anterior. 409 recarga el panel para ofrecer el enlace.
   * 503 y status 0 dejan la metadata y permiten reintentar.
   */

  private presentContentError(error: unknown, request: DocumentContentRequest): void {
    const status = error instanceof HttpErrorResponse ? error.status : undefined;
    const mapped = this.examRequests.mapContentError(error);

    if (status === 409 || mapped === 'document_is_external_url') {
      this.dropContent(request.examType, request.documentType);
      this.setDocumentNotice(
        request.documentType,
        `${EXAM_REQUEST_ERROR_I18N_SCOPE}.document_is_external_url`,
      );
      this.reload();
      return;
    }

    if (status === 404 || mapped === 'document_not_found') {
      this.dropContent(request.examType, request.documentType);
      this.setDocumentNotice(
        request.documentType,
        `${EXAM_REQUEST_ERROR_I18N_SCOPE}.document_not_found`,
      );
      return;
    }

    this.setDocumentNotice(request.documentType, `${EXAM_REQUEST_ERROR_I18N_SCOPE}.${mapped}`);
  }

  private setDocumentNotice(documentType: DocumentType, key: string): void {
    this.documentNotices.update((current) => ({ ...current, [documentType]: key }));
  }

  /** Descarta la respuesta que todavía no haya llegado. La caché permanece. */
  private closeViewer(): void {
    this.contentEpoch += 1;
    this.inflightKey = null;
    this.openContent$.next(null);
  }

  private invalidateDocument(examType: ExamType, documentType: DocumentType): void {
    const prefix = `${examType}\u0000${documentType}\u0000`;
    this.dropContent(examType, documentType);
    if (this.inflightKey?.startsWith(prefix)) {
      this.closeViewer();
    }
  }

  private dropContent(examType: ExamType, documentType: DocumentType): void {
    const prefix = `${examType}\u0000${documentType}\u0000`;
    for (const key of [...this.contentCache.keys()]) {
      if (!key.startsWith(prefix)) {
        continue;
      }

      const entry = this.contentCache.get(key);
      if (entry) {
        this.releaseEntry(entry);
      }
      this.contentCache.delete(key);
    }
  }

  private clearContentCache(): void {
    for (const entry of this.contentCache.values()) {
      this.releaseEntry(entry);
    }
    this.contentCache.clear();
    this.inflightKey = null;
  }

  private releaseEntry(entry: ContentCacheEntry): void {
    URL.revokeObjectURL(entry.objectUrl);
  }
}

function shouldReconcilePanelAfterSaveError(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) {
    return true;
  }

  return error.status === 0 || error.status === 409 || error.status >= 500;
}

function contentCacheKey(
  request: Pick<DocumentContentRequest, 'examType' | 'documentType' | 'uploadedAt'>,
): string {
  return `${request.examType}\u0000${request.documentType}\u0000${request.uploadedAt}`;
}
