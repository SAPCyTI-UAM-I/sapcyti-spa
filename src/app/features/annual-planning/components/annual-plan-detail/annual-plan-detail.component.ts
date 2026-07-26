import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Message } from 'primeng/message';
import { finalize } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import { getApiErrorMessage } from '../../../../core/errors/utils/parse-api-error.util';
import { AnnualPlanDetail, AnnualPlanStatus, FormatCheckReport } from '../../../../models';
import { CatalogTagComponent, LoadStateComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { downloadBlob } from '../../../../shared/utils/download.util';
import { AnnualPlanService } from '../../services/annual-plan.service';
import {
  ANNUAL_PLAN_ERROR_I18N_SCOPE,
  AnnualPlanError,
  mapAnnualPlanError,
} from '../../utils/annual-plan-error.util';
import {
  nextStatuses,
  statusActionLabelKey,
  statusTagSeverity,
} from '../../utils/annual-plan-status.util';
import { AnnualPlanGridComponent } from '../annual-plan-grid/annual-plan-grid.component';

interface StatusAction {
  target: AnnualPlanStatus;
  labelKey: string;
}

/** HU-50/51/52/53 — plan detail: grid, Excel export and status transitions. */
@Component({
  selector: 'app-annual-plan-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    RouterLink,
    TranslatePipe,
    Button,
    Dialog,
    Message,
    DomainErrorMessagePipe,
    CatalogTagComponent,
    LoadStateComponent,
    AnnualPlanGridComponent,
  ],
  templateUrl: './annual-plan-detail.component.html',
})
export class AnnualPlanDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(AnnualPlanService);
  private readonly destroyRef = inject(DestroyRef);

  readonly year = Number(this.route.snapshot.paramMap.get('year'));
  readonly errorScope = ANNUAL_PLAN_ERROR_I18N_SCOPE;

  readonly plan = signal<AnnualPlanDetail | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly actionError = signal<AnnualPlanError | null>(null);

  readonly pendingStatus = signal<AnnualPlanStatus | null>(null);
  readonly changingStatus = signal(false);
  readonly exporting = signal(false);

  // HU-49 — optional Excel comparison against the active catalog (draft only).
  readonly showCheckDialog = signal(false);
  readonly checking = signal(false);
  readonly checkFile = signal<File | null>(null);
  readonly checkReport = signal<FormatCheckReport | null>(null);
  readonly checkError = signal<AnnualPlanError | null>(null);
  readonly checkFileMessage = signal<string | null>(null);

  readonly reportIsClean = computed(() => {
    const report = this.checkReport();
    return (
      !!report &&
      report.missingInCatalog.length === 0 &&
      report.missingInFile.length === 0 &&
      report.nameMismatches.length === 0 &&
      report.unknownPrograms.length === 0 &&
      report.missingPrograms.length === 0
    );
  });

  readonly statusTagSeverity = statusTagSeverity;

  readonly statusActions = computed<StatusAction[]>(() => {
    const current = this.plan()?.status;
    if (!current) {
      return [];
    }
    return nextStatuses(current).map((target) => ({
      target,
      labelKey: statusActionLabelKey(current, target),
    }));
  });

  /** Reopening to BORRADOR desyncs with the catalog → mandatory warning. */
  readonly isReopenPending = computed(() => this.pendingStatus() === 'BORRADOR');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service
      .get(this.year)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (plan) => this.plan.set(plan),
        error: () => this.loadError.set(true),
      });
  }

  onSaved(detail: AnnualPlanDetail): void {
    this.plan.set(detail);
  }

  askStatusChange(target: AnnualPlanStatus): void {
    this.pendingStatus.set(target);
  }

  cancelStatusChange(): void {
    this.pendingStatus.set(null);
  }

  confirmStatusChange(): void {
    const target = this.pendingStatus();
    if (!target) {
      return;
    }
    this.changingStatus.set(true);
    this.actionError.set(null);
    this.service
      .changeStatus(this.year, { status: target })
      .pipe(
        finalize(() => this.changingStatus.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.pendingStatus.set(null);
          // Reload so a reopen reflects the catalog sync (rows/snapshots may change).
          this.load();
        },
        error: (error) => {
          this.pendingStatus.set(null);
          this.actionError.set(mapAnnualPlanError(error));
        },
      });
  }

  downloadExcel(): void {
    this.exporting.set(true);
    this.actionError.set(null);
    this.service
      .export(this.year)
      .pipe(
        finalize(() => this.exporting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (blob) => downloadBlob(blob, `Planeacion PCyTI ${this.year}.xlsx`),
        error: (error) => this.actionError.set(mapAnnualPlanError(error)),
      });
  }

  openCheckDialog(): void {
    this.checkFile.set(null);
    this.checkReport.set(null);
    this.checkError.set(null);
    this.checkFileMessage.set(null);
    this.showCheckDialog.set(true);
  }

  closeCheckDialog(): void {
    if (this.checking()) {
      return;
    }
    this.showCheckDialog.set(false);
  }

  onCheckFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.checkFile.set(input.files?.[0] ?? null);
    this.checkReport.set(null);
    this.checkError.set(null);
    this.checkFileMessage.set(null);
  }

  runCheck(): void {
    const file = this.checkFile();
    if (!file) {
      return;
    }
    this.checking.set(true);
    this.checkError.set(null);
    this.checkFileMessage.set(null);
    this.service
      .check(file)
      .pipe(
        finalize(() => this.checking.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (report) => this.checkReport.set(report),
        error: (error) => {
          const mapped = mapAnnualPlanError(error);
          this.checkError.set(mapped);
          if (mapped === 'file_format_invalid') {
            this.checkFileMessage.set(getApiErrorMessage(error) ?? null);
          }
        },
      });
  }
}
