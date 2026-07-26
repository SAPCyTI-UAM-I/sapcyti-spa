import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';

import { GroupStudent, PlanWarning } from '../../../../models';
import { FieldErrorComponent } from '../../../../shared/components';
import { InfoChipDirective } from '../../directives/info-chip.directive';
import { PlanPickersController } from '../../services/plan-pickers.controller';
import {
  buildStudentRow,
  GroupFormGroup,
  hasScheduleDayCapture,
} from '../../utils/group-form.util';
import { ScheduleSubformComponent } from '../schedule-subform/schedule-subform.component';

/** One group: compact Excel-like summary that expands into the full editor on demand. */
@Component({
  selector: 'app-group-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    TranslatePipe,
    Button,
    InputText,
    Message,
    Select,
    MultiSelect,
    FieldErrorComponent,
    InfoChipDirective,
    ScheduleSubformComponent,
  ],
  templateUrl: './group-card.component.html',
})
export class GroupCardComponent {
  private readonly people = inject(PlanPickersController);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = input.required<GroupFormGroup>();
  /**
   * Snapshots que devolvió el servidor: aportan trimestre declarado y `source`, que el
   * formulario no lleva (solo guarda studentId + nota). No se mutan al agregar o quitar.
   */
  readonly students = input.required<GroupStudent[]>();
  readonly warnings = input<PlanWarning[]>([]);
  readonly ueaGroupCount = input(1);
  /** Año del plan anual que fija el cupo; null si el trimestre viene mal formado. */
  readonly annualPlanYear = input<number | null>(null);
  readonly groupLimitExceeded = input(false);
  readonly editable = input(true);
  readonly submitted = input(false);
  readonly expanded = input(false);

  readonly removeGroup = output<void>();
  readonly toggleExpanded = output<void>();

  /**
   * Los valores de un `FormControl` no son señales, así que un `computed` que los lee
   * no se recalcula al teclear. Se bombea una revisión desde `valueChanges`, mismo
   * patrón que `annual-plan-grid` y `field-error`.
   */
  private readonly revision = signal(0);

  /** Selección transitoria del typeahead de alta; se limpia en cuanto se agrega. */
  readonly studentPick = signal<number | null>(null);

  /**
   * Integrantes actuales, alineados por índice con las filas del `FormArray` de alumnos:
   * el formulario manda (studentId + nota), los snapshots del servidor solo decoran.
   */
  readonly members = computed<GroupStudent[]>(() => {
    this.revision();
    const snapshots = this.students();
    return this.form().controls.students.controls.map((row) => {
      const studentId = row.controls.studentId.value;
      return (
        snapshots.find((student) => student.studentId === studentId) ??
        this.fallbackMember(studentId)
      );
    });
  });

  /** Capacity is enforced on save; this keeps the violation next to the affected group. */
  readonly overCapacity = computed(() => {
    this.revision();
    const cupo = this.form().controls.cupo.value.trim();
    if (!cupo || cupo === '*') return false;
    const limit = Number(cupo);
    return !Number.isNaN(limit) && this.members().length > limit;
  });

  /** Snapshot del catálogo; es una de las columnas del formato oficial (HU-58). */
  readonly tipoUea = computed(() => this.form().controls.tipoUea.value);
  readonly maxGroups = computed(() => this.form().controls.maxGroups.value.trim() || '—');

  /** Responsables resueltos desde las opciones fijadas por el editor. */
  readonly professorSummary = computed(() => {
    this.revision();
    const labels = new Map(this.people.professors().map((option) => [option.value, option.label]));
    return this.form()
      .controls.professorIds.value.map((id) => labels.get(id))
      .filter((label): label is string => label !== undefined)
      .join(' · ');
  });

  /** Días con cualquier captura; permite verificar el horario sin abrir el grupo. */
  readonly configuredSchedule = computed(() => {
    this.revision();
    return this.form()
      .controls.schedule.controls.map((day) => ({
        day: day.controls.day.value,
        start: day.controls.start.value,
        end: day.controls.end.value,
        lab: day.controls.lab.value,
        configured: hasScheduleDayCapture(day),
      }))
      .filter(({ configured }) => configured);
  });

  readonly professorOptions = this.people.professors;
  readonly studentOptions = this.people.students;
  readonly professorsLoading = this.people.professorsLoading;
  readonly studentsLoading = this.people.studentsLoading;

  constructor() {
    // El input `form` puede cambiar de instancia: se resuscribe con cada una.
    effect((onCleanup) => {
      const subscription = this.form().valueChanges.subscribe(() =>
        this.revision.update((value) => value + 1),
      );
      onCleanup(() => subscription.unsubscribe());
    });
  }

  onProfessorFilter(event: { filter?: string | null }): void {
    this.people.onProfessorFilter(event.filter);
  }

  onStudentFilter(event: { filter?: string | null }): void {
    this.people.onStudentFilter(event.filter);
  }

  /** HU-59 — alta desde el typeahead; elegir a alguien que ya está en el grupo no duplica. */
  addStudent(studentId: number | null): void {
    if (!this.editable() || studentId === null) return;

    const rows = this.form().controls.students;
    if (!rows.controls.some((row) => row.controls.studentId.value === studentId)) {
      rows.push(buildStudentRow(this.fb, studentId));
    }
    this.studentPick.set(null);
  }

  removeStudent(index: number): void {
    if (!this.editable()) return;
    this.form().controls.students.removeAt(index);
  }

  studentInactive(member: GroupStudent): boolean {
    return this.warnings().some(
      (warning) =>
        warning.code === 'STUDENT_INACTIVE' &&
        warning.enrollmentId === member.enrollmentId &&
        (warning.groupId === undefined || warning.groupId === this.form().controls.id.value),
    );
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
}
