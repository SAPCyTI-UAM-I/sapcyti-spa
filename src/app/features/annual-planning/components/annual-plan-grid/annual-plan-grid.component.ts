import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { finalize } from 'rxjs';

import { AnnualPlanDetail, AnnualPlanMark, AnnualPlanMarks, ProgramCode } from '../../../../models';
import { TOAST_LIFE } from '../../../../shared/utils/toast.util';
import { AnnualPlanService } from '../../services/annual-plan.service';
import {
  AnnualPlanEntryFormValue,
  buildSaveEntriesRequest,
  cycleMark,
  isValidCell,
  PROGRAM_CODES,
} from '../../utils/annual-plan-cell.util';
import { mapAnnualPlanError } from '../../utils/annual-plan-error.util';

/** Marks a group/quota cell invalid when it is not empty, `"*"` or a positive int. */
function cellValidator(control: AbstractControl): ValidationErrors | null {
  return isValidCell(control.value) ? null : { invalidCell: true };
}

/**
 * HU-51 — editable grid of a plan. Group/quota cells are a reactive FormArray with
 * inline validation; program marks are click-cycled and kept in a parallel signal.
 * `TERMINADA`/`ARCHIVADA` render read-only (no inputs).
 */
@Component({
  selector: 'app-annual-plan-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslatePipe, Button],
  templateUrl: './annual-plan-grid.component.html',
})
export class AnnualPlanGridComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(AnnualPlanService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly plan = input.required<AnnualPlanDetail>();
  readonly saved = output<AnnualPlanDetail>();

  readonly programCodes = PROGRAM_CODES;
  readonly saving = signal(false);
  readonly submitted = signal(false);

  readonly editable = computed(() => this.plan().status === 'BORRADOR');

  /** One group of 6 cell controls per entry, aligned by index with `plan().entries`. */
  readonly rows = this.fb.array<FormGroup>([]);
  readonly marks = signal<AnnualPlanMarks[]>([]);

  constructor() {
    effect(() => this.buildForm(this.plan()));
  }

  private buildForm(plan: AnnualPlanDetail): void {
    this.rows.clear();
    for (const entry of plan.entries) {
      this.rows.push(
        this.fb.group({
          gruposI: this.fb.control(entry.gruposI ?? '', cellValidator),
          cupoI: this.fb.control(entry.cupoI ?? '', cellValidator),
          gruposP: this.fb.control(entry.gruposP ?? '', cellValidator),
          cupoP: this.fb.control(entry.cupoP ?? '', cellValidator),
          gruposO: this.fb.control(entry.gruposO ?? '', cellValidator),
          cupoO: this.fb.control(entry.cupoO ?? '', cellValidator),
        }),
      );
    }
    this.marks.set(plan.entries.map((entry) => ({ ...entry.marks })));
    this.submitted.set(false);
  }

  rowGroup(index: number): FormGroup {
    return this.rows.at(index) as FormGroup;
  }

  cellInvalid(index: number, name: string): boolean {
    return this.submitted() && !!this.rowGroup(index).get(name)?.invalid;
  }

  markAt(index: number, code: ProgramCode): AnnualPlanMark | undefined {
    return this.marks()[index]?.[code];
  }

  cycle(index: number, code: ProgramCode): void {
    if (!this.editable()) {
      return;
    }
    this.marks.update((list) => {
      const copy = list.map((entry) => ({ ...entry }));
      const target = copy[index];
      if (!target) {
        return list;
      }
      const next = cycleMark(target[code]);
      if (next) {
        target[code] = next;
      } else {
        delete target[code];
      }
      return copy;
    });
  }

  save(): void {
    this.submitted.set(true);
    if (this.rows.invalid) {
      this.messages.add({
        severity: 'error',
        summary: this.translate.instant('ANNUAL_PLANNING.GRID.INVALID_CELLS'),
        life: TOAST_LIFE.DEFAULT,
      });
      return;
    }

    const plan = this.plan();
    const values: AnnualPlanEntryFormValue[] = plan.entries.map((entry, index) => ({
      id: entry.id,
      ...(this.rowGroup(index).getRawValue() as Omit<AnnualPlanEntryFormValue, 'id' | 'marks'>),
      marks: this.marks()[index] ?? {},
    }));

    this.saving.set(true);
    this.service
      .saveEntries(plan.year, buildSaveEntriesRequest(values))
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (detail) => {
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant('ANNUAL_PLANNING.GRID.SAVED'),
            life: TOAST_LIFE.DEFAULT,
          });
          this.saved.emit(detail);
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
}
