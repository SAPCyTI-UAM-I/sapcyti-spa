import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { finalize } from 'rxjs';

import { FieldErrorComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { AnnualPlanService } from '../../services/annual-plan.service';
import {
  ANNUAL_PLAN_ERROR_I18N_SCOPE,
  AnnualPlanError,
  mapAnnualPlanError,
} from '../../utils/annual-plan-error.util';

/**
 * HU-49 — create an annual plan. Only the year is required; the plan is generated
 * from the active UEA catalog and preloaded from the previous year's plan if it
 * exists (otherwise blank). Comparing against an .xlsx is optional and lives in
 * the plan detail, not here.
 */
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
  readonly submitted = signal(false);
  readonly creating = signal(false);
  readonly error = signal<AnnualPlanError | null>(null);

  private readonly currentYear = new Date().getFullYear();
  readonly form = this.fb.group({
    year: this.fb.control(this.currentYear + 1, [
      Validators.required,
      Validators.min(2000),
      Validators.max(2100),
    ]),
  });

  create(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.controls.year.invalid) {
      return;
    }

    this.creating.set(true);
    this.service
      .create({ year: this.form.controls.year.value })
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
