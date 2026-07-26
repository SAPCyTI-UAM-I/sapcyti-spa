import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { finalize } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import { GroupStudent, SCHEDULE_DAYS, TrimestralPlanDetail } from '../../../../models';
import { I18nSelectComponent } from '../../../../shared/components';
import { shouldShowFieldError } from '../../../../shared/utils/field-error.util';
import { termYear } from '../../../../shared/utils/term.util';
import { TOAST_LIFE } from '../../../../shared/utils/toast.util';
import { PlanPickersController } from '../../services/plan-pickers.controller';
import { TrimestralPlanService } from '../../services/trimestral-plan.service';
import {
  addStudentIfAbsent,
  buildGroupFormGroup,
  buildSaveGroupsRequest,
  emptyGroup,
  GroupFormGroup,
} from '../../utils/group-form.util';
import { claveHeaderPositions } from '../../utils/group-ordering.util';
import { nextGroupLetter } from '../../utils/group-letter.util';
import {
  isGroupIncomplete,
  occupancyLabel,
  OccupancySeverity,
  occupancySeverity,
} from '../../utils/occupancy.util';
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

/** Constantes: el vacío también necesita identidad estable para no redibujar la celda. */
const EMPTY_IDS: readonly number[] = [];
const EMPTY_MEMBERS: readonly GroupStudent[] = [];

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
    RouterLink,
    TranslatePipe,
    Button,
    Checkbox,
    Dialog,
    InputText,
    Message,
    MultiSelect,
    Select,
    I18nSelectComponent,
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
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

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

  readonly pendingRemoval = signal<GroupFormGroup | null>(null);

  /** Selección transitoria del selector de alta; se limpia en cuanto se agrega. */
  readonly ueaPick = signal<number | null>(null);

  readonly ueaOptions = this.people.ueas;
  readonly ueasLoading = this.people.ueasLoading;
  readonly professorOptions = this.people.professors;
  readonly professorsLoading = this.people.professorsLoading;
  readonly studentOptions = this.people.students;
  readonly studentsLoading = this.people.studentsLoading;

  /**
   * Ediciones capturadas que aún no se guardan. El detalle lo consulta antes de
   * Terminar: al cambiar de estado el plan se recarga y el formulario se reconstruye,
   * así que sin esta guarda los cambios se perderían en silencio.
   */
  readonly hasUnsavedChanges = signal(false);

  /**
   * Contador de cambios del formulario: los valores de un `FormControl` no son señales,
   * así que los `computed` que los leen necesitan un disparador.
   *
   * No sirve `hasUnsavedChanges` para esto: una vez en `true` deja de notificar, y quitar
   * un grupo no recalculaba nada — la bandera de «excede el límite» se quedaba pegada al
   * grupo que ya no la incumplía. Un contador siempre cambia de valor.
   */
  readonly revision = signal(0);

  /** El cupo lo fija el plan anual del año del trimestre; la tarjeta enlaza ahí. */
  readonly annualPlanYear = computed(() => termYear(this.plan().term));

  readonly editable = computed(() => {
    const plan = this.plan();
    return (
      isEditable(plan.status) &&
      plan.prerequisites.surveyClosed &&
      plan.prerequisites.annualPlanTerminated
    );
  });

  readonly capacityViolationIndices = computed(() => {
    this.revision();
    return this.groups.controls.flatMap((group, index) => {
      const cupo = group.controls.cupo.value.trim();
      if (!cupo || cupo === '*') return [];
      const limit = Number(cupo);
      return Number.isInteger(limit) && group.controls.students.length > limit ? [index] : [];
    });
  });

  readonly groupLimitViolationIndices = computed(() => {
    this.revision();
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

  /** Las dos violaciones en un solo conjunto: alimenta el filtro y el badge de la tarjeta. */
  readonly violatingGroupIndices = computed(
    () => new Set([...this.capacityViolationIndices(), ...this.groupLimitViolationIndices()]),
  );

  readonly filteredOrder = computed(() => {
    const filters = this.filterValue();
    // Group code, membership, professors and schedule are editable FormControls.
    this.revision();

    const violating = this.violatingGroupIndices();
    return this.order().filter((index) =>
      matchesGroupFilters(
        this.groups.at(index),
        {
          search: filters.search ?? '',
          ueaType: filters.ueaType ?? '',
          state: filters.state ?? '',
        },
        violating.has(index),
      ),
    );
  });

  /** Dónde arranca cada UEA en la lista visible, para el encabezado que las agrupa. */
  readonly claveHeaders = computed(() =>
    claveHeaderPositions(
      this.filteredOrder(),
      (index) => this.groups.at(index).controls.clave.value,
    ),
  );

  readonly filtersActive = computed(() => {
    const filters = this.filterValue();
    return !!filters.search?.trim() || !!filters.ueaType || !!filters.state;
  });

  readonly errorScope = TRIMESTRAL_PLAN_ERROR_I18N_SCOPE;

  /** Columnas del formato oficial; se usa para el colspan del divisor por UEA. */
  readonly scheduleDays = SCHEDULE_DAYS;
  readonly totalColumns = 10 + SCHEDULE_DAYS.length * 3;

  // ─── Celdas derivadas (antes vivían en la tarjeta de grupo) ───

  /**
   * Nombres de los profesores elegidos, para la columna PROF. Salen de las opciones que
   * `pinProfessors` mantiene fijas, así que un profesor dado de baja pero ya asignado
   * sigue apareciendo.
   */
  private readonly professorNamesByIndex = computed<readonly string[]>(() => {
    this.revision();
    // Solo el nombre: el NEMP ya vive en su propia columna, repetirlo es ruido.
    this.people.professors();
    return this.groups.controls.map((group) =>
      group.controls.professorIds.value
        .map((id) => this.people.professorNameOf(id))
        .filter(Boolean)
        .join(' · '),
    );
  });

  professorNames(index: number): string {
    return this.professorNamesByIndex()[index] ?? '';
  }

  /**
   * Integrantes por grupo, alineados con las filas del `FormArray`: el formulario manda
   * (studentId + nota) y los snapshots del servidor solo decoran.
   *
   * Se calcula **una vez por cambio del formulario**, no por llamada: la plantilla lo lee
   * en cada ciclo de detección y devolver un arreglo nuevo cada vez hacía que PrimeNG
   * viera un modelo distinto, volviera a marcar para revisar y el ciclo no terminara.
   */
  private readonly membersByIndex = computed<readonly GroupStudent[][]>(() => {
    this.revision();
    const snapshots = this.studentsByIndex();
    return this.groups.controls.map((group, index) =>
      group.controls.students.controls.map((row) => {
        const studentId = row.controls.studentId.value;
        return (
          (snapshots[index] ?? []).find((student) => student.studentId === studentId) ??
          this.fallbackMember(studentId)
        );
      }),
    );
  });

  private readonly studentIdsByIndex = computed<readonly number[][]>(() => {
    this.revision();
    return this.groups.controls.map((group) =>
      group.controls.students.controls.map((row) => row.controls.studentId.value),
    );
  });

  membersFor(index: number): readonly GroupStudent[] {
    return this.membersByIndex()[index] ?? EMPTY_MEMBERS;
  }

  studentNames(index: number): string {
    return this.membersFor(index)
      .map((member) => member.fullName)
      .filter(Boolean)
      .join(' · ');
  }

  occupancyFor(index: number): string {
    this.revision();
    const group = this.groups.at(index);
    return occupancyLabel(group.controls.cupo.value, group.controls.students.length);
  }

  occupancySeverityFor(index: number): OccupancySeverity {
    this.revision();
    const group = this.groups.at(index);
    return occupancySeverity(group.controls.cupo.value, group.controls.students.length);
  }

  incompleteFor(index: number): boolean {
    this.revision();
    return isGroupIncomplete(this.groups.at(index));
  }

  private static readonly OCCUPANCY_CHIP_CLASS: Record<OccupancySeverity, string> = {
    ok: 'bg-surface-subtle text-text-secondary',
    full: 'bg-warning-container text-warning-strong',
    over: 'bg-error-container text-on-error-container',
  };

  occupancyChipClass(index: number): string {
    return TrimestralPlanEditorComponent.OCCUPANCY_CHIP_CLASS[this.occupancySeverityFor(index)];
  }

  onProfessorFilter(event: { filter?: string | null }): void {
    this.people.onProfessorFilter(event.filter);
  }

  onStudentFilter(event: { filter?: string | null }): void {
    this.people.onStudentFilter(event.filter);
  }

  /** Días con alguna captura, para leer el horario de un grupo de un vistazo. */
  studentInactive(index: number, member: GroupStudent): boolean {
    const groupId = this.groups.at(index).controls.id.value;
    return this.plan().warnings.some(
      (warning) =>
        warning.code === 'STUDENT_INACTIVE' &&
        warning.enrollmentId === member.enrollmentId &&
        (warning.groupId === undefined || warning.groupId === groupId),
    );
  }

  // ─── Errores por celda ───

  /**
   * Con 25 filas × 5 días, un mensaje por celda es ilegible: se marca el borde y el
   * detalle va en el `title`, con un único banner al pie. Mismo criterio que la anual.
   */
  cellInvalid(index: number, control: 'grupo' | 'cupo'): boolean {
    this.revision();
    return shouldShowFieldError(this.groups.at(index).controls[control], this.submitted());
  }

  scheduleCellInvalid(index: number, dayIndex: number, field: 'start' | 'end'): boolean {
    this.revision();
    const day = this.groups.at(index).controls.schedule.at(dayIndex);
    return (
      shouldShowFieldError(day.controls[field], this.submitted()) ||
      shouldShowFieldError(day, this.submitted())
    );
  }

  /** Clave i18n del problema de un día, para el `title` de la celda. */
  scheduleCellError(index: number, dayIndex: number, field: 'start' | 'end'): string {
    this.revision();
    const day = this.groups.at(index).controls.schedule.at(dayIndex);
    if (day.controls[field].errors?.['timeFormat']) {
      return 'TRIMESTRAL_PLANNING.GROUP.TIME_FORMAT_INVALID';
    }
    if (day.errors?.['labTimeRequired']) return 'TRIMESTRAL_PLANNING.GROUP.LAB_TIME_REQUIRED';
    if (day.errors?.['incompleteRange']) return 'TRIMESTRAL_PLANNING.GROUP.TIME_RANGE_REQUIRED';
    if (day.errors?.['startAfterEnd']) return 'TRIMESTRAL_PLANNING.GROUP.START_AFTER_END';
    return '';
  }

  // ─── Celda de alumnos ───

  selectedStudentIds(index: number): readonly number[] {
    return this.studentIdsByIndex()[index] ?? EMPTY_IDS;
  }

  /**
   * Sincroniza la selección con el `FormArray` **por diferencia**, nunca reconstruyéndolo:
   * las filas que siguen elegidas conservan su `FormGroup` y con él la nota ya capturada.
   */
  onStudentsChange(index: number, ids: readonly number[]): void {
    if (!this.editable()) return;

    const rows = this.groups.at(index).controls.students;
    for (const id of ids) {
      addStudentIfAbsent(this.fb, rows, id);
    }
    const keep = new Set(ids);
    for (let row = rows.length - 1; row >= 0; row--) {
      if (!keep.has(rows.at(row).controls.studentId.value)) {
        rows.removeAt(row);
      }
    }
    this.bumpRevision();
  }

  /** Alumno marcado que el servidor aún no conoce: se arma del catálogo del picker. */
  private fallbackMember(studentId: number): GroupStudent {
    const picked = this.people.studentById(studentId);
    return {
      studentId,
      enrollmentId: picked?.enrollmentId ?? '',
      fullName: picked
        ? [picked.firstName, picked.firstLastName, picked.secondLastName].filter(Boolean).join(' ')
        : '',
      source: 'MANUAL',
      academicTerm: null,
      obs: null,
    };
  }

  constructor() {
    effect(() => this.buildForm(this.plan()));
    this.groups.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.hasUnsavedChanges.set(true);
      this.bumpRevision();
    });
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
      this.reorder();
      // Explícito además del `valueChanges`: quitar un grupo cambia quién incumple el
      // límite de la UEA, y esas banderas se calculan sobre el resto de los grupos.
      this.bumpRevision();
    }
    this.pendingRemoval.set(null);
  }

  private bumpRevision(): void {
    this.revision.update((value) => value + 1);
  }

  onRemoveDialogVisibleChange(visible: boolean): void {
    if (!visible) {
      this.cancelRemoveGroup();
    }
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
    // Con hermanos existentes la letra se deduce (CR43 → CR43A); sin ellos se captura.
    group.grupo = nextGroupLetter(
      this.groupsForUea(ueaId).map((sibling) => sibling.controls.grupo.value),
    );
    this.groups.push(buildGroupFormGroup(this.fb, group));
    this.studentsByIndex.update((all) => [...all, []]);
    this.clearFilters();
    this.ueaPick.set(null);
    this.reorder();
  }

  /**
   * HU-59 — alta desde el panel de pendientes. El editor sigue siendo el único dueño
   * del `FormArray`: el detalle pide, no muta. Expande el grupo para que el alta se
   * vea, que es la mitad del punto de resolverlo desde la lista de pendientes.
   */
  assignStudent(studentId: number, group: GroupFormGroup): void {
    if (!this.editable()) return;

    addStudentIfAbsent(this.fb, group.controls.students, studentId);
  }

  /** Grupos candidatos para una UEA; el panel de pendientes filtra con esto. */
  groupsForUea(ueaId: number): GroupFormGroup[] {
    this.revision();
    return this.groups.controls.filter((group) => group.controls.ueaId.value === ueaId);
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
    this.revision();
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

  /** En una tabla no hay nada que expandir: basta con quitar el filtro y llevar el foco. */
  private revealInvalidGroups(): void {
    this.clearFilters();
    this.scrollToFirstInvalid();
  }

  /**
   * Expandir no basta con 25 grupos: había que buscar a mano cuál falló. Es mecánica
   * de DOM, así que vive en el componente y no en un util.
   */
  private scrollToFirstInvalid(): void {
    afterNextRender(
      () => {
        const target = this.host.nativeElement.querySelector<HTMLElement>(
          '[data-testid="trimestral-group-row"][data-invalid="true"]',
        );
        target?.scrollIntoView({ block: 'center' });
        target?.querySelector<HTMLElement>('input, select, [tabindex]')?.focus();
      },
      { injector: this.injector },
    );
  }
}
