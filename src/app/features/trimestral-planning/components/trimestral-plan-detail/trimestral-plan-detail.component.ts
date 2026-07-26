import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Message } from 'primeng/message';
import { finalize } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import { PlanWarning, TrimestralPlanDetail, TrimestralPlanStatus } from '../../../../models';
import { CatalogTagComponent, LoadStateComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { downloadBlob } from '../../../../shared/utils/download.util';
import { TrimestralPlanService } from '../../services/trimestral-plan.service';
import {
  mapTrimestralPlanError,
  TRIMESTRAL_PLAN_ERROR_I18N_SCOPE,
  TrimestralPlanError,
} from '../../utils/trimestral-plan-error.util';
import { GroupFormGroup } from '../../utils/group-form.util';
import { computePlanSummary } from '../../utils/plan-summary.util';
import { isEditable, statusTagSeverity } from '../../utils/trimestral-plan-status.util';
import { GroupFilterState } from '../../utils/trimestral-group-filter.util';
import { ExcelPreviewComponent } from '../excel-preview/excel-preview.component';
import {
  AssignRequest,
  GroupOption,
  PlanPendingComponent,
} from '../plan-pending/plan-pending.component';
import { PlanSummaryComponent } from '../plan-summary/plan-summary.component';
import { TrimestralPlanEditorComponent } from '../trimestral-plan-editor/trimestral-plan-editor.component';

/** HU-58/59/60 — the generated plan: warnings, group editor, status actions and export. */
@Component({
  selector: 'app-trimestral-plan-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    RouterLink,
    DatePipe,
    TranslatePipe,
    Button,
    Dialog,
    Message,
    CatalogTagComponent,
    LoadStateComponent,
    DomainErrorMessagePipe,
    ExcelPreviewComponent,
    PlanPendingComponent,
    PlanSummaryComponent,
    TrimestralPlanEditorComponent,
  ],
  templateUrl: './trimestral-plan-detail.component.html',
})
export class TrimestralPlanDetailComponent implements OnInit {
  private readonly service = inject(TrimestralPlanService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  readonly id = Number(this.route.snapshot.paramMap.get('id'));

  readonly plan = signal<TrimestralPlanDetail | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly actionError = signal<TrimestralPlanError | null>(null);
  readonly changingStatus = signal(false);
  readonly regenerating = signal(false);
  readonly exporting = signal(false);

  readonly showRegenerateDialog = signal(false);
  readonly showBackToDraftDialog = signal(false);
  readonly showUnsavedDialog = signal(false);
  /** Terminar quedó en espera de que el guardado en curso termine bien. */
  private readonly pendingFinishAfterSave = signal(false);

  /** Referencia al editor: el botón «Guardar grupos» vive en el encabezado del detalle. */
  protected readonly editor = viewChild(TrimestralPlanEditorComponent);

  readonly editable = computed(() => {
    const current = this.plan();
    return (
      current !== null &&
      isEditable(current.status) &&
      current.prerequisites.surveyClosed &&
      current.prerequisites.annualPlanTerminated
    );
  });

  readonly draft = computed(() => this.plan()?.status === 'BORRADOR');
  readonly prerequisitesMet = computed(() => {
    const prerequisites = this.plan()?.prerequisites;
    return !!prerequisites?.surveyClosed && !!prerequisites.annualPlanTerminated;
  });
  readonly dirty = computed(() => this.editor()?.hasUnsavedChanges() ?? false);

  /** Both plan statuses are exportable, but stale local edits and prerequisites block it. */
  readonly canExport = computed(() => {
    const current = this.plan();
    return (
      current !== null &&
      this.prerequisitesMet() &&
      (current.status === 'BORRADOR' || current.status === 'TERMINADA') &&
      !this.dirty()
    );
  });

  /** Los conteos salen del formulario vivo, así que reflejan lo capturado sin guardar. */
  readonly summary = computed(() => {
    const editor = this.editor();
    const current = this.plan();
    if (!editor || !current) return null;
    // El contador de cambios del editor es lo que dispara el recálculo al teclear.
    editor.revision();
    return computePlanSummary(
      editor.groups.controls,
      current.blankStudents.length + current.unassignedDemand.length,
      editor.violatingGroupIndices(),
    );
  });

  readonly hasPending = computed(() => {
    const current = this.plan();
    return !!current && current.blankStudents.length + current.unassignedDemand.length > 0;
  });

  /**
   * Grupos ofrecidos en el panel de pendientes. `null` significa «cualquier grupo»,
   * que es el caso de una inscripción en blanco: no declaró UEA.
   *
   * Las listas se arman una vez por recálculo y se cachean por UEA: devolver un arreglo
   * nuevo en cada ciclo de detección haría que PrimeNG redibujara el desplegable abierto.
   */
  readonly groupOptions = computed(() => {
    const editor = this.editor();
    editor?.revision();

    const byUea = new Map<number | null, GroupOption[]>();
    const toOption = (group: GroupFormGroup): GroupOption => ({
      label: `${group.controls.clave.value} · ${group.controls.grupo.value || '—'}`,
      value: group,
    });

    if (editor) {
      byUea.set(null, editor.groups.controls.map(toOption));
      for (const group of editor.groups.controls) {
        const ueaId = group.controls.ueaId.value;
        if (!byUea.has(ueaId)) {
          byUea.set(ueaId, editor.groupsForUea(ueaId).map(toOption));
        }
      }
    }

    return (ueaId: number | null): GroupOption[] => byUea.get(ueaId) ?? [];
  });

  readonly statusTagSeverity = statusTagSeverity;
  readonly errorScope = TRIMESTRAL_PLAN_ERROR_I18N_SCOPE;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service
      .get(this.id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (plan) => this.plan.set(plan),
        error: () => {
          this.plan.set(null);
          this.loadError.set(true);
        },
      });
  }

  onSaved(plan: TrimestralPlanDetail): void {
    this.plan.set(plan);
    if (this.pendingFinishAfterSave()) {
      this.pendingFinishAfterSave.set(false);
      this.changeStatus('TERMINADA');
    }
  }

  /** Aplica el filtro que describe la cifra pulsada en el resumen. */
  applyFilter(state: GroupFilterState): void {
    this.editor()?.filters.patchValue({ state });
  }

  onAssign({ studentId, group }: AssignRequest): void {
    this.editor()?.assignStudent(studentId, group);
  }

  onCreateGroupForUea(ueaId: number): void {
    this.editor()?.addGroup(ueaId);
  }

  /**
   * El diálogo de cambios sin guardar solo ofrecía Cancelar: había que cerrarlo, subir
   * a buscar Guardar y volver a pulsar Terminar. Esto encadena las dos acciones.
   */
  saveAndFinish(): void {
    const editor = this.editor();
    if (!editor) return;

    this.showUnsavedDialog.set(false);
    this.pendingFinishAfterSave.set(true);
    editor.save();
  }

  /**
   * Salir por el breadcrumb o por «atrás» perdía las ediciones sin ningún aviso.
   *
   * ponytail: `confirm()` nativo en vez de armar un `p-dialog` asíncrono con un
   * Subject; se cambia si aparece una segunda ruta que necesite lo mismo.
   */
  canDeactivate(): boolean {
    if (!this.dirty()) return true;
    return confirm(this.translate.instant('TRIMESTRAL_PLANNING.DETAIL.LEAVE_UNSAVED_CONFIRM'));
  }

  /** Interpolation params for `TRIMESTRAL_PLANNING.WARNINGS.{code}`. */
  warningParams(warning: PlanWarning): Record<string, string> {
    return {
      clave: warning.clave ?? '',
      enrollmentId: warning.enrollmentId ?? '',
      employeeNumber: warning.employeeNumber ?? '',
    };
  }

  /** Terminar is blocked until every local edit has been persisted. */
  finish(): void {
    if (!this.prerequisitesMet()) return;
    if (this.editor()?.hasUnsavedChanges()) {
      this.showUnsavedDialog.set(true);
      return;
    }
    this.changeStatus('TERMINADA');
  }

  /**
   * Only a plan that has actually been exported needs the delivered-Excel warning.
   * `exportedAt` is historical and is intentionally preserved when the plan is reopened.
   */
  backToDraft(): void {
    if (!this.prerequisitesMet()) return;
    if (this.plan()?.exportedAt) {
      this.showBackToDraftDialog.set(true);
      return;
    }
    this.changeStatus('BORRADOR');
  }

  confirmBackToDraft(): void {
    this.showBackToDraftDialog.set(false);
    this.changeStatus('BORRADOR');
  }

  confirmRegenerate(): void {
    this.showRegenerateDialog.set(false);
    if (!this.editable() || this.regenerating()) return;

    this.regenerating.set(true);
    this.actionError.set(null);
    this.service
      .regenerate(this.id)
      .pipe(
        finalize(() => this.regenerating.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (plan) => this.plan.set(plan),
        error: (err) => this.actionError.set(mapTrimestralPlanError(err)),
      });
  }

  downloadExcel(): void {
    if (!this.canExport() || this.exporting()) return;

    this.exporting.set(true);
    this.actionError.set(null);
    this.service
      .export(this.id)
      .pipe(
        finalize(() => this.exporting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (blob) => {
          downloadBlob(blob, `PCYTI ${this.plan()?.term ?? this.id}.xlsx`);
          // Export returns bytes. Reload so the response model receives the new exportedAt.
          this.load();
        },
        error: (err) => this.actionError.set(mapTrimestralPlanError(err)),
      });
  }

  private changeStatus(status: TrimestralPlanStatus): void {
    if (this.changingStatus()) return;

    this.changingStatus.set(true);
    this.actionError.set(null);
    this.service
      .changeStatus(this.id, { status })
      .pipe(
        finalize(() => this.changingStatus.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (plan) => this.plan.set(plan),
        error: (err) => this.actionError.set(mapTrimestralPlanError(err)),
      });
  }
}
