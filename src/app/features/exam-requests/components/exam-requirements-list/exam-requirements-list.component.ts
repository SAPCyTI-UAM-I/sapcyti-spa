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
import { catchError, EMPTY, finalize, Observable, Subject, switchMap } from 'rxjs';

import { AuthStateService } from '../../../../core/auth/auth.service';
import {
  Degree,
  DocumentType,
  ExamOptionsDto,
  ExamPanelResponse,
  ExamRequestDto,
  ExamRequirementDto,
  ExamType,
  SaveDocumentsResponse,
} from '../../../../models';
import {
  CatalogTagComponent,
  I18nSelectComponent,
  type I18nSelectOption,
  LoadStateComponent,
} from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { ExamRequestService } from '../../services/exam-request.service';
import { degreeTagSeverity } from '../../utils/degree-tag.util';
import { formatDocumentFileSize, formatUploadedAt } from '../../utils/exam-document-format.util';
import {
  localizeDocumentFileName,
  resolveDocumentNameLanguage,
} from '../../utils/exam-document-name.util';
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

  /** Solo tipos sin documento vigente; el reemplazo es PUT (HU-65 Tarea 6). */
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
        this.clearPendingSelections();
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

  private reconcilePanel(examType: ExamType, writeKey: ExamRequestWriteError): void {
    this.examRequests
      .getPanel(examType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (panel) => {
          this.panel.set(panel);
          this.saveWriteError.set(writeKey);
        },
        error: () => this.saveWriteError.set(writeKey),
      });
  }

  private clearPendingSelections(): void {
    this.pendingSelections.set({});
  }

  private clearAcademicState(): void {
    this.clearPendingSelections();
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
}

function shouldReconcilePanelAfterSaveError(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) {
    return true;
  }

  return error.status === 0 || error.status === 409 || error.status >= 500;
}
