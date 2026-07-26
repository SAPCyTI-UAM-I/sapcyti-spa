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
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Message } from 'primeng/message';
import { finalize } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import { PlanWarning, TrimestralPlanDetail, TrimestralPlanStatus } from '../../../../models';
import { CatalogTagComponent, LoadStateComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { TrimestralPlanService } from '../../services/trimestral-plan.service';
import {
  mapTrimestralPlanError,
  TRIMESTRAL_PLAN_ERROR_I18N_SCOPE,
  TrimestralPlanError,
} from '../../utils/trimestral-plan-error.util';
import { isEditable, statusTagSeverity } from '../../utils/trimestral-plan-status.util';
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
    TrimestralPlanEditorComponent,
  ],
  templateUrl: './trimestral-plan-detail.component.html',
})
export class TrimestralPlanDetailComponent implements OnInit {
  private readonly service = inject(TrimestralPlanService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

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
          this.triggerDownload(blob);
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

  // ponytail: descarga única, sin util compartido (igual que annual-plan-detail).
  private triggerDownload(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `PCYTI ${this.plan()?.term ?? this.id}.xlsx`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
