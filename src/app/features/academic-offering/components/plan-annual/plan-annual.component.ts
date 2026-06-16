import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel } from 'primeng/accordion';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Tag } from 'primeng/tag';

import { AnnualPlanDetail, AnnualPlanTerm, AvailableAnnualSubject } from '../../../../models';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
// DEMO DATA — remove this import (and the assignments below) to drop all example data.
import {
  SAMPLE_ANNUAL_PLANS,
  SAMPLE_AVAILABLE_SUBJECTS,
} from '../../mocks/academic-offering.sample-data';
import { termStatusSeverity } from '../../utils/term-status.util';

/**
 * HU-04 — Planeación anual (cascarón), módulo único en formato acordeón.
 *
 * A `p-accordion` of annual plans by year; expanding a year reveals its
 * trimesters, each with "Ver" (read-only UEAs) and, when the plan is still
 * PRELIMINARY, "Editar" ("Activar UEA's"). No data layer yet (TODO).
 */
@Component({
  selector: 'app-plan-annual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    Accordion,
    AccordionContent,
    AccordionHeader,
    AccordionPanel,
    Button,
    Checkbox,
    Dialog,
    InputText,
    Message,
    Tag,
  ],
  templateUrl: './plan-annual.component.html',
})
export class PlanAnnualComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  /** Status → PrimeNG tag severity (template helper). */
  readonly statusSeverity = termStatusSeverity;

  // TODO(HU-04): load the annual plans from the academic-offering service.
  readonly plans = signal<AnnualPlanDetail[]>(SAMPLE_ANNUAL_PLANS);

  // Edit dialog ("Activar UEA's").
  readonly editDialogVisible = signal(false);
  readonly termUnderEdit = signal<AnnualPlanTerm | null>(null);
  // TODO(HU-04): load the available subjects for the term being edited.
  readonly dialogSubjects = signal<AvailableAnnualSubject[]>(SAMPLE_AVAILABLE_SUBJECTS);

  // Read-only "Ver" dialog.
  readonly viewDialogVisible = signal(false);
  readonly termUnderView = signal<AnnualPlanTerm | null>(null);

  readonly editForm = this.fb.group({
    subjects: this.fb.array<FormGroup>([]),
  });

  get subjectRows(): FormGroup[] {
    return this.editForm.controls.subjects.controls as FormGroup[];
  }

  isYearEditable(plan: AnnualPlanDetail): boolean {
    return plan.status === 'PRELIMINARY';
  }

  /** A trimester can be consulted once it has at least one activated UEA. */
  canView(term: AnnualPlanTerm): boolean {
    return term.enabledSubjects.length > 0;
  }

  allTermsEdited(plan: AnnualPlanDetail): boolean {
    return plan.terms.every((term) => term.status === 'EDITED');
  }

  viewTerm(term: AnnualPlanTerm): void {
    this.termUnderView.set(term);
    this.viewDialogVisible.set(true);
  }

  closeViewDialog(): void {
    this.viewDialogVisible.set(false);
    this.termUnderView.set(null);
  }

  editTerm(term: AnnualPlanTerm): void {
    this.termUnderEdit.set(term);
    this.buildSubjectRows();
    this.editDialogVisible.set(true);
  }

  closeEditDialog(): void {
    this.editDialogVisible.set(false);
    this.termUnderEdit.set(null);
  }

  saveTerm(): void {
    if (this.editForm.invalid) {
      return;
    }
    // TODO(HU-04): persist the enabled subjects with their groups/capacity.
    this.closeEditDialog();
  }

  /** One reactive row per available subject: enable flag + groups + capacity. */
  private buildSubjectRows(): void {
    const rows = this.dialogSubjects().map(() =>
      this.fb.group({
        enabled: this.fb.control(false),
        groups: this.fb.control(1, [Validators.required, Validators.min(1)]),
        capacity: this.fb.control(20, [Validators.required, Validators.min(1)]),
      }),
    );
    this.editForm.setControl('subjects', this.fb.array(rows));
  }
}
