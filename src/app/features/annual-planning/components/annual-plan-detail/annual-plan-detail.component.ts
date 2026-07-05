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
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Message } from 'primeng/message';
import { finalize } from 'rxjs';

import { AnnualPlanDetail, AnnualPlanStatus } from '../../../../models';
import { CatalogTagComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { TOAST_LIFE } from '../../../../shared/utils/toast.util';
import { AnnualPlanService } from '../../services/annual-plan.service';
import { mapAnnualPlanError } from '../../utils/annual-plan-error.util';
import { nextStatuses, statusTagSeverity } from '../../utils/annual-plan-status.util';
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
    CatalogTagComponent,
    AnnualPlanGridComponent,
  ],
  templateUrl: './annual-plan-detail.component.html',
})
export class AnnualPlanDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(AnnualPlanService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly year = Number(this.route.snapshot.paramMap.get('year'));

  readonly plan = signal<AnnualPlanDetail | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal(false);

  readonly pendingStatus = signal<AnnualPlanStatus | null>(null);
  readonly changingStatus = signal(false);
  readonly exporting = signal(false);

  readonly statusTagSeverity = statusTagSeverity;

  readonly statusActions = computed<StatusAction[]>(() => {
    const current = this.plan()?.status;
    if (!current) {
      return [];
    }
    return nextStatuses(current).map((target) => ({
      target,
      labelKey: actionLabelKey(current, target),
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
          this.messages.add({
            severity: 'error',
            summary: this.translate.instant(`ANNUAL_PLANNING.ERRORS.${mapAnnualPlanError(error)}`),
            life: TOAST_LIFE.DEFAULT,
          });
        },
      });
  }

  downloadExcel(): void {
    this.exporting.set(true);
    this.service
      .export(this.year)
      .pipe(
        finalize(() => this.exporting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (blob) => this.triggerDownload(blob),
        error: (error) => {
          this.messages.add({
            severity: 'error',
            summary: this.translate.instant(`ANNUAL_PLANNING.ERRORS.${mapAnnualPlanError(error)}`),
            life: TOAST_LIFE.DEFAULT,
          });
        },
      });
  }

  // ponytail: descarga única, sin util compartido.
  private triggerDownload(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Planeacion PCyTI ${this.year}.xlsx`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

function actionLabelKey(current: AnnualPlanStatus, target: AnnualPlanStatus): string {
  if (target === 'ARCHIVADA') {
    return 'ANNUAL_PLANNING.ACTIONS.ARCHIVE';
  }
  if (target === 'BORRADOR') {
    return 'ANNUAL_PLANNING.ACTIONS.REOPEN';
  }
  // target === 'TERMINADA'
  return current === 'BORRADOR'
    ? 'ANNUAL_PLANNING.ACTIONS.FINISH'
    : 'ANNUAL_PLANNING.ACTIONS.UNARCHIVE';
}
