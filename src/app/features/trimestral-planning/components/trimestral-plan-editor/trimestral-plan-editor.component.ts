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
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { finalize } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import { GroupStudent, TrimestralPlanDetail } from '../../../../models';
import { I18nSelectComponent } from '../../../../shared/components';
import { TOAST_LIFE } from '../../../../shared/utils/toast.util';
import { PlanPickersController } from '../../services/plan-pickers.controller';
import { TrimestralPlanService } from '../../services/trimestral-plan.service';
import {
  buildGroupFormGroup,
  buildSaveGroupsRequest,
  emptyGroup,
  GroupFormGroup,
} from '../../utils/group-form.util';
import {
  GROUP_STATE_FILTERS,
  type GroupFilterState,
  matchesGroupFilters,
  UEA_TYPE_FILTERS,
} from '../../utils/trimestral-group-filter.util';
import {
  mapTrimestralPlanError,
  TRIMESTRAL_PLAN_ERROR_I18N_SCOPE,
  TrimestralPlanError,
} from '../../utils/trimestral-plan-error.util';
import { isEditable } from '../../utils/trimestral-plan-status.util';
import { GroupCardComponent } from '../group-card/group-card.component';

/**
 * HU-59 — group editor. Unlike the annual grid (fixed rows mirrored by index), the
 * `FormArray` here IS the source of truth: groups and students are added and removed,
 * so the form cannot be a projection of an immutable input.
 */
@Component({
  selector: 'app-trimestral-plan-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    TranslatePipe,
    Button,
    Dialog,
    InputText,
    Message,
    Select,
    I18nSelectComponent,
    GroupCardComponent,
    DomainErrorMessagePipe,
  ],
  providers: [PlanPickersController],
  templateUrl: './trimestral-plan-editor.component.html',
})
export class TrimestralPlanEditorComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(TrimestralPlanService);
  private readonly people = inject(PlanPickersController);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly plan = input.required<TrimestralPlanDetail>();
  readonly saved = output<TrimestralPlanDetail>();

  readonly groups = this.fb.array<GroupFormGroup>([]);
  /**
   * Student snapshots per group, kept beside the form: names and matrículas are read-only
   * data the API never accepts back, while the form only carries studentId + nota.
   */
  readonly studentsByIndex = signal<GroupStudent[][]>([]);

  /**
   * Índices de los grupos ordenados por clave de UEA (decisión 2026-07-21: lista plana,
   * sin secciones por cohorte — distintos alumnos meten las UEAs en desorden y agrupar
   * por letra fragmentaba la lista). Se recalcula al construir, agregar o quitar grupos;
   * la clave es un snapshot inmutable, así que teclear nunca reordena.
   */
  readonly order = signal<number[]>([]);

  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly error = signal<TrimestralPlanError | null>(null);

  /** Same search/filter vocabulary used by the academic catalog lists. */
  readonly filters = this.fb.group({
    search: [''],
    ueaType: [''],
    state: this.fb.control<GroupFilterState>(''),
  });
  private readonly filterValue = toSignal(this.filters.valueChanges, {
    initialValue: this.filters.getRawValue(),
  });
  readonly ueaTypeFilters = UEA_TYPE_FILTERS;
  readonly groupStateFilters = GROUP_STATE_FILTERS;

  /** FormGroup identity is stable while editing, unlike array indexes after a removal. */
  readonly expandedGroups = signal<ReadonlySet<GroupFormGroup>>(new Set());
  readonly pendingRemoval = signal<GroupFormGroup | null>(null);

  /** Selección transitoria del selector de alta; se limpia en cuanto se agrega. */
  readonly ueaPick = signal<number | null>(null);

  readonly ueaOptions = this.people.ueas;
  readonly ueasLoading = this.people.ueasLoading;

  /**
   * Ediciones capturadas que aún no se guardan. El detalle lo consulta antes de
   * Terminar: al cambiar de estado el plan se recarga y el formulario se reconstruye,
   * así que sin esta guarda los cambios se perderían en silencio.
   */
  readonly hasUnsavedChanges = signal(false);

  readonly editable = computed(() => {
    const plan = this.plan();
    return (
      isEditable(plan.status) &&
      plan.prerequisites.surveyClosed &&
      plan.prerequisites.annualPlanTerminated
    );
  });

  readonly capacityViolationIndices = computed(() => {
    this.hasUnsavedChanges();
    return this.groups.controls.flatMap((group, index) => {
      const cupo = group.controls.cupo.value.trim();
      if (!cupo || cupo === '*') return [];
      const limit = Number(cupo);
      return Number.isInteger(limit) && group.controls.students.length > limit ? [index] : [];
    });
  });

  readonly groupLimitViolationIndices = computed(() => {
    this.hasUnsavedChanges();
    const counts = new Map<number, number>();
    for (const group of this.groups.controls) {
      counts.set(group.controls.ueaId.value, (counts.get(group.controls.ueaId.value) ?? 0) + 1);
    }
    return this.groups.controls.flatMap((group, index) => {
      const maxGroups = group.controls.maxGroups.value.trim();
      if (!maxGroups || maxGroups === '*') return [];
      const limit = Number(maxGroups);
      return Number.isInteger(limit) && (counts.get(group.controls.ueaId.value) ?? 0) > limit
        ? [index]
        : [];
    });
  });

  readonly hasLimitViolations = computed(
    () =>
      this.capacityViolationIndices().length > 0 || this.groupLimitViolationIndices().length > 0,
  );

  readonly filteredOrder = computed(() => {
    const filters = this.filterValue();
    // Group code, membership, professors and schedule are editable FormControls.
    this.hasUnsavedChanges();

    return this.order().filter((index) =>
      matchesGroupFilters(this.groups.at(index), {
        search: filters.search ?? '',
        ueaType: filters.ueaType ?? '',
        state: filters.state ?? '',
      }),
    );
  });

  readonly filtersActive = computed(() => {
    const filters = this.filterValue();
    return !!filters.search?.trim() || !!filters.ueaType || !!filters.state;
  });

  readonly allVisibleExpanded = computed(() => {
    const visible = this.filteredOrder();
    const expanded = this.expandedGroups();
    return visible.length > 0 && visible.every((index) => expanded.has(this.groups.at(index)));
  });

  readonly errorScope = TRIMESTRAL_PLAN_ERROR_I18N_SCOPE;

  constructor() {
    effect(() => this.buildForm(this.plan()));
    this.groups.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.hasUnsavedChanges.set(true));
    this.people.loadProfessors();
    this.people.loadStudents();
    this.people.loadUeas();
  }

  requestRemoveGroup(group: GroupFormGroup): void {
    if (this.editable()) {
      this.pendingRemoval.set(group);
    }
  }

  cancelRemoveGroup(): void {
    this.pendingRemoval.set(null);
  }

  confirmRemoveGroup(): void {
    const group = this.pendingRemoval();
    if (!group || !this.editable()) return;

    const index = this.groups.controls.indexOf(group);
    if (index >= 0) {
      this.groups.removeAt(index);
      this.studentsByIndex.update((all) => all.filter((_, i) => i !== index));
      this.expandedGroups.update((current) => {
        const next = new Set(current);
        next.delete(group);
        return next;
      });
      this.reorder();
    }
    this.pendingRemoval.set(null);
  }

  onRemoveDialogVisibleChange(visible: boolean): void {
    if (!visible) {
      this.cancelRemoveGroup();
    }
  }

  toggleGroup(group: GroupFormGroup): void {
    this.expandedGroups.update((current) => {
      const next = new Set(current);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }

  isExpanded(group: GroupFormGroup): boolean {
    return this.expandedGroups().has(group);
  }

  toggleAllVisible(): void {
    const collapse = this.allVisibleExpanded();
    this.expandedGroups.update((current) => {
      const next = new Set(current);
      for (const index of this.filteredOrder()) {
        const group = this.groups.at(index);
        if (collapse) {
          next.delete(group);
        } else {
          next.add(group);
        }
      }
      return next;
    });
  }

  clearFilters(): void {
    this.filters.reset({ search: '', ueaType: '', state: '' });
  }

  /**
   * HU-59 — agrega un grupo para una UEA del catálogo. Nace vacío (sin letra, cupo ni
   * alumnos) y con `id: 0`, que `buildSaveGroupsRequest` traduce a `id: null` para la API.
   */
  addGroup(ueaId: number | null): void {
    if (!this.editable() || ueaId === null) return;

    const uea = this.people.ueaById(ueaId);
    if (!uea) return;

    const group = emptyGroup(uea);
    const annualSettings = this.plan().groups.find((candidate) => candidate.ueaId === ueaId);
    if (annualSettings) {
      group.cupo = annualSettings.cupo;
      group.maxGroups = annualSettings.maxGroups;
    }
    this.groups.push(buildGroupFormGroup(this.fb, group));
    const added = this.groups.at(this.groups.length - 1);
    this.studentsByIndex.update((all) => [...all, []]);
    this.clearFilters();
    this.expandedGroups.update((current) => new Set([...current, added]));
    this.ueaPick.set(null);
    this.reorder();
  }

  onUeaFilter(event: { filter?: string | null }): void {
    this.people.onUeaFilter(event.filter);
  }

  save(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (!this.editable() || this.saving()) {
      return;
    }
    if (this.groups.invalid || this.hasLimitViolations()) {
      this.revealInvalidGroups();
      return;
    }

    this.saving.set(true);
    this.service
      .saveGroups(this.plan().id, buildSaveGroupsRequest(this.groups.controls))
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (detail) => {
          this.hasUnsavedChanges.set(false);
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant('TRIMESTRAL_PLANNING.DETAIL.SAVED'),
            life: TOAST_LIFE.DEFAULT,
          });
          this.saved.emit(detail);
        },
        error: (err) => this.error.set(mapTrimestralPlanError(err)),
      });
  }

  private buildForm(plan: TrimestralPlanDetail): void {
    this.groups.clear();
    for (const group of plan.groups) {
      this.groups.push(buildGroupFormGroup(this.fb, group));
    }
    this.studentsByIndex.set(plan.groups.map((group) => [...group.students]));
    // Los ya asignados se fijan en las opciones para que el multiselect los muestre
    // marcados aunque el buscador no los devuelva (p. ej. un alumno dado de baja).
    this.people.pinStudents(plan.groups.flatMap((group) => group.students));
    this.people.pinProfessors(plan.groups);
    this.submitted.set(false);
    this.error.set(null);
    this.pendingRemoval.set(null);
    this.expandedGroups.set(new Set());
    // Se limpia al final: clear()/push() emiten valueChanges de forma síncrona.
    this.hasUnsavedChanges.set(false);
    if (
      !isEditable(plan.status) ||
      !plan.prerequisites.surveyClosed ||
      !plan.prerequisites.annualPlanTerminated
    ) {
      this.groups.disable({ emitEvent: false });
    }
    this.reorder();
  }

  groupCount(ueaId: number): number {
    this.hasUnsavedChanges();
    return this.groups.controls.filter((group) => group.controls.ueaId.value === ueaId).length;
  }

  private reorder(): void {
    const clave = (index: number) => this.groups.at(index).controls.clave.value;
    this.order.set(
      this.groups.controls
        .map((_, index) => index)
        .sort((a, b) => clave(a).localeCompare(clave(b), 'es', { numeric: true })),
    );
  }

  private revealInvalidGroups(): void {
    this.clearFilters();
    const groupLimitViolations = new Set(this.groupLimitViolationIndices());
    this.expandedGroups.update((current) => {
      const next = new Set(current);
      this.groups.controls.forEach((group, index) => {
        if (group.invalid || groupLimitViolations.has(index)) {
          next.add(group);
        }
      });
      return next;
    });
  }
}
