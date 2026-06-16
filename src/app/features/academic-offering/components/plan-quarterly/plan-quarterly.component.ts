import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { DatePicker } from 'primeng/datepicker';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';

import { AcademicOfferingOption, QuarterlyPlanSubject, Weekday } from '../../../../models';
import { FieldErrorComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
// DEMO DATA — remove this import (and the assignments below) to drop all example data.
import {
  SAMPLE_CURRENT_TERM,
  SAMPLE_PROFESSORS,
  SAMPLE_QUARTERLY_SUBJECTS,
  SAMPLE_STUDENTS,
  SAMPLE_TERMS,
} from '../../mocks/academic-offering.sample-data';

const WEEKDAYS: readonly Weekday[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

/**
 * HU-05 — Editar plan trimestral (cascarón).
 *
 * UI shell only: term selector (with the current active term), a dedicated
 * per-term view that lists the generated subjects one row per group, the
 * per-group edit dialog (schedule, professor(s), group, capacity, single-student
 * research case) and the consolidated full-plan view with search. No data layer
 * yet — data comes from the demo module and handlers are stubbed (TODO).
 */
@Component({
  selector: 'app-plan-quarterly',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    Button,
    Checkbox,
    DatePicker,
    Dialog,
    FieldErrorComponent,
    InputText,
    MultiSelect,
    Select,
  ],
  templateUrl: './plan-quarterly.component.html',
})
export class PlanQuarterlyComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  // TODO(HU-05): load options/data from the academic-offering service.
  readonly terms = signal<AcademicOfferingOption[]>(SAMPLE_TERMS);
  readonly professors = signal<AcademicOfferingOption[]>(SAMPLE_PROFESSORS);
  readonly students = signal<AcademicOfferingOption[]>(SAMPLE_STUDENTS);
  readonly subjects = signal<QuarterlyPlanSubject[]>([]);

  /** The term currently active in the system (shown as "Trimestre actual es"). */
  readonly currentTerm = signal<string>(SAMPLE_CURRENT_TERM);
  readonly selectedTerm = signal<string | null>(null);
  readonly termConfirmed = signal(false);
  readonly showFullPlan = signal(false);

  /** Professor/subject search for the consolidated full-plan view (legacy "buscador"). */
  readonly fullPlanSearch = signal('');
  private readonly fullPlanSubjects = computed(() => {
    const query = this.fullPlanSearch().trim().toLowerCase();
    if (!query) {
      return this.subjects();
    }
    return this.subjects().filter((subject) =>
      [subject.key, subject.name, subject.professorName, subject.employeeNumber]
        .filter((field): field is string => !!field)
        .some((field) => field.toLowerCase().includes(query)),
    );
  });

  /** Rows for the table: filtered consolidated plan when expanded, raw list otherwise. */
  readonly displayedSubjects = computed(() =>
    this.showFullPlan() ? this.fullPlanSubjects() : this.subjects(),
  );

  readonly editDialogVisible = signal(false);
  readonly subjectUnderEdit = signal<QuarterlyPlanSubject | null>(null);

  /** Day options for the schedule multiselect (label resolved in the template). */
  readonly weekdayOptions = WEEKDAYS.map((day) => ({ value: day }));

  readonly editForm = this.fb.group({
    days: [[] as Weekday[]],
    startTime: [null as Date | null],
    endTime: [null as Date | null],
    professors: [[] as string[]],
    group: ['', Validators.required],
    capacity: [null as number | null, [Validators.required, Validators.min(1)]],
    singleStudent: [false],
    student: [''],
  });

  onTermChange(term: string): void {
    this.selectedTerm.set(term);
    this.termConfirmed.set(false);
  }

  /** "Continuar": load the generated subjects and switch to the dedicated term view. */
  loadPlan(): void {
    if (this.selectedTerm() === null) {
      return;
    }
    // TODO(HU-05): load subjects generated from the annual plan for this term.
    this.subjects.set(SAMPLE_QUARTERLY_SUBJECTS);
    this.termConfirmed.set(true);
  }

  /** Back to the term selector without losing the current selection. */
  changeTerm(): void {
    this.termConfirmed.set(false);
    this.showFullPlan.set(false);
  }

  modifySubjects(): void {
    // TODO(HU-05): open the add/remove-subjects flow (modify plan vs annual plan).
  }

  openEdit(subject: QuarterlyPlanSubject): void {
    this.subjectUnderEdit.set(subject);
    // TODO(HU-05): hydrate the edit form from `subject`.
    this.editForm.reset({ group: subject.group, capacity: subject.capacity });
    this.editDialogVisible.set(true);
  }

  closeEdit(): void {
    this.editDialogVisible.set(false);
    this.subjectUnderEdit.set(null);
  }

  save(): void {
    if (this.editForm.invalid) {
      return;
    }
    // TODO(HU-05): persist the subject schedule/professors/group/capacity.
    this.closeEdit();
  }

  toggleFullPlan(): void {
    this.showFullPlan.update((value) => !value);
  }

  onFullPlanSearch(event: Event): void {
    this.fullPlanSearch.set((event.target as HTMLInputElement).value);
  }
}
