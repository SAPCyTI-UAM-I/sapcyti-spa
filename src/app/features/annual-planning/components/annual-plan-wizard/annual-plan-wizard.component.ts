import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { finalize } from 'rxjs';

import { getApiErrorMessage } from '../../../../core/errors/utils/parse-api-error.util';
import { FormatCheckReport } from '../../../../models';
import { FieldErrorComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { AnnualPlanService } from '../../services/annual-plan.service';
import {
  ANNUAL_PLAN_ERROR_I18N_SCOPE,
  AnnualPlanError,
  mapAnnualPlanError,
} from '../../utils/annual-plan-error.util';

/** HU-49 — three-step wizard: pick year → upload .xlsx for the check → review + create. */
@Component({
  selector: 'app-annual-plan-wizard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    Button,
    InputText,
    Message,
    FieldErrorComponent,
  ],
  templateUrl: './annual-plan-wizard.component.html',
})
export class AnnualPlanWizardComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(AnnualPlanService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly errorScope = ANNUAL_PLAN_ERROR_I18N_SCOPE;

  readonly step = signal(1);
  readonly submitted = signal(false);

  readonly selectedFile = signal<File | null>(null);
  readonly report = signal<FormatCheckReport | null>(null);

  readonly checking = signal(false);
  readonly creating = signal(false);
  readonly error = signal<AnnualPlanError | null>(null);
  /** Verbatim backend detail for FILE_FORMAT_INVALID (names the missing section/column). */
  readonly fileFormatMessage = signal<string | null>(null);

  private readonly currentYear = new Date().getFullYear();
  readonly form = this.fb.group({
    year: this.fb.control(this.currentYear + 1, [
      Validators.required,
      Validators.min(2000),
      Validators.max(2100),
    ]),
  });

  readonly reportIsClean = computed(() => {
    const report = this.report();
    return (
      !!report &&
      report.missingInCatalog.length === 0 &&
      report.missingInFile.length === 0 &&
      report.nameMismatches.length === 0 &&
      report.unknownPrograms.length === 0 &&
      report.missingPrograms.length === 0
    );
  });

  toStep2(): void {
    this.submitted.set(true);
    if (this.form.controls.year.invalid) {
      return;
    }
    this.submitted.set(false);
    this.error.set(null);
    this.step.set(2);
  }

  backToStep1(): void {
    this.error.set(null);
    this.fileFormatMessage.set(null);
    this.step.set(1);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
    this.error.set(null);
    this.fileFormatMessage.set(null);
  }

  runCheck(): void {
    const file = this.selectedFile();
    if (!file) {
      return;
    }
    this.checking.set(true);
    this.error.set(null);
    this.fileFormatMessage.set(null);

    this.service
      .check(file)
      .pipe(
        finalize(() => this.checking.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (report) => {
          this.report.set(report);
          this.step.set(3);
        },
        error: (error) => {
          const mapped = mapAnnualPlanError(error);
          this.error.set(mapped);
          if (mapped === 'file_format_invalid') {
            this.fileFormatMessage.set(getApiErrorMessage(error) ?? null);
          }
        },
      });
  }

  create(): void {
    this.creating.set(true);
    this.error.set(null);
    const year = this.form.controls.year.value;

    this.service
      .create({ year })
      .pipe(
        finalize(() => this.creating.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (plan) => this.router.navigate(['/annual-planning', plan.year]),
        error: (error) => this.error.set(mapAnnualPlanError(error)),
      });
  }

  cancel(): void {
    void this.router.navigate(['/annual-planning']);
  }
}
