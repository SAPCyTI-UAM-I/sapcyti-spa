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
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Message } from 'primeng/message';
import { finalize } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import {
  AnnualPlanDetail,
  AnnualPlanEntry,
  AnnualPlanMark,
  AnnualPlanMarks,
  ProgramCode,
} from '../../../../models';
import { TOAST_LIFE } from '../../../../shared/utils/toast.util';
import { AnnualPlanService } from '../../services/annual-plan.service';
import {
  AnnualPlanEntryFormValue,
  buildSaveEntriesRequest,
  CELL_FIELDS,
  CellField,
  cycleMark,
  isValidCell,
  PROGRAM_CODES,
} from '../../utils/annual-plan-cell.util';
import {
  ANNUAL_PLAN_ERROR_I18N_SCOPE,
  AnnualPlanError,
  mapAnnualPlanError,
} from '../../utils/annual-plan-error.util';

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
  imports: [ReactiveFormsModule, TranslatePipe, Message, DomainErrorMessagePipe],
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
  readonly cellFields = CELL_FIELDS;
  readonly errorScope = ANNUAL_PLAN_ERROR_I18N_SCOPE;

  /** Group/quota fields paired per trimester — lets the mobile card label each with its term. */
  private static readonly TERM_CELL_FIELDS = [
    { grupos: 'gruposI', cupo: 'cupoI' },
    { grupos: 'gruposP', cupo: 'cupoP' },
    { grupos: 'gruposO', cupo: 'cupoO' },
  ] as const satisfies readonly { grupos: CellField; cupo: CellField }[];

  readonly termColumns = computed(() =>
    AnnualPlanGridComponent.TERM_CELL_FIELDS.map((cells, index) => ({
      ...cells,
      label: this.plan().terms[index] ?? '',
    })),
  );

  /** PCyTI's obligatoria/optativa mark comes from the UEA catalog — read-only here. */
  readonly readonlyMark = (code: ProgramCode): boolean => code === 'PCYTI';

  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly error = signal<AnnualPlanError | null>(null);
  /** Bumped on every cell change so `cellInvalid`/`showInvalidMessage` recompute live. */
  private readonly revision = signal(0);

  readonly editable = computed(() => this.plan().status === 'BORRADOR');

  readonly showInvalidMessage = computed(() => {
    this.revision();
    return this.submitted() && this.rows.invalid;
  });

  /** One group of 6 cell controls per entry, aligned by index with `plan().entries`. */
  readonly rows = this.fb.array<FormGroup>([]);
  readonly marks = signal<AnnualPlanMarks[]>([]);

  // Display order only (clave/nombre); the form stays aligned with plan().entries so
  // sorting never rebuilds controls or drops unsaved edits.
  readonly sortField = signal<'clave' | 'nombre' | null>(null);
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  readonly orderedRows = computed<{ index: number; entry: AnnualPlanEntry }[]>(() => {
    const rows = this.plan().entries.map((entry, index) => ({ index, entry }));
    const field = this.sortField();
    if (!field) {
      return rows;
    }
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => a.entry[field].localeCompare(b.entry[field], 'es') * dir);
  });

  sortBy(field: 'clave' | 'nombre'): void {
    if (this.sortField() === field) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }

  ariaSort(field: 'clave' | 'nombre'): 'ascending' | 'descending' | 'none' {
    if (this.sortField() !== field) {
      return 'none';
    }
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  sortIcon(field: 'clave' | 'nombre'): string {
    if (this.sortField() !== field) {
      return 'pi-sort-alt text-text-tertiary';
    }
    return this.sortDir() === 'asc' ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down';
  }

  constructor() {
    effect(() => this.buildForm(this.plan()));
    this.rows.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.revision.update((value) => value + 1));
  }

  private buildForm(plan: AnnualPlanDetail): void {
    this.rows.clear();
    for (const entry of plan.entries) {
      const controls = Object.fromEntries(
        CELL_FIELDS.map((field) => [field, this.fb.control(entry[field] ?? '', cellValidator)]),
      ) as Record<CellField, FormControl<string>>;
      this.rows.push(this.fb.group(controls));
    }
    this.marks.set(plan.entries.map((entry) => ({ ...entry.marks })));
    this.submitted.set(false);
    this.error.set(null);
  }

  rowGroup(index: number): FormGroup {
    return this.rows.at(index) as FormGroup;
  }

  cellInvalid(index: number, name: string): boolean {
    this.revision();
    return this.submitted() && !!this.rowGroup(index).get(name)?.invalid;
  }

  markAt(index: number, code: ProgramCode): AnnualPlanMark | undefined {
    return this.marks()[index]?.[code];
  }

  cycle(index: number, code: ProgramCode): void {
    if (!this.editable() || this.readonlyMark(code)) {
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
    this.error.set(null);
    if (this.rows.invalid) {
      return;
    }

    const plan = this.plan();
    const values: AnnualPlanEntryFormValue[] = plan.entries.map((entry, index) => ({
      id: entry.id,
      ...(this.rowGroup(index).getRawValue() as Record<CellField, string>),
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
        error: (error) => this.error.set(mapAnnualPlanError(error)),
      });
  }
}
