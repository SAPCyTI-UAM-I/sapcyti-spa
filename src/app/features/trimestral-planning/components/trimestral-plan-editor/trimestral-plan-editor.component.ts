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
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { finalize } from 'rxjs';

import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import { GroupStudent, TrimestralPlanDetail } from '../../../../models';
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
    Message,
    Select,
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
   * data the API never accepts back, while the form only carries `studentIds`.
   */
  readonly studentsByIndex = signal<GroupStudent[][]>([]);

  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly error = signal<TrimestralPlanError | null>(null);

  /** Selección transitoria del selector de alta; se limpia en cuanto se agrega. */
  readonly ueaPick = signal<number | null>(null);

  readonly ueaOptions = this.people.ueas;
  readonly peopleLoading = this.people.loading;

  /**
   * Ediciones capturadas que aún no se guardan. El detalle lo consulta antes de
   * Terminar: al cambiar de estado el plan se recarga y el formulario se reconstruye,
   * así que sin esta guarda los cambios se perderían en silencio.
   */
  readonly hasUnsavedChanges = signal(false);

  readonly editable = computed(() => isEditable(this.plan().status));
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

  removeGroup(index: number): void {
    this.groups.removeAt(index);
    this.studentsByIndex.update((all) => all.filter((_, i) => i !== index));
  }

  /**
   * HU-59 — agrega un grupo para una UEA del catálogo. Nace vacío (sin letra, cupo ni
   * alumnos) y con `id: 0`, que `buildSaveGroupsRequest` traduce a `id: null` para la API.
   */
  addGroup(ueaId: number | null): void {
    if (ueaId === null) return;

    const uea = this.people.ueaById(ueaId);
    if (!uea) return;

    this.groups.push(buildGroupFormGroup(this.fb, emptyGroup(uea)));
    this.studentsByIndex.update((all) => [...all, []]);
    this.ueaPick.set(null);
  }

  onUeaFilter(event: { filter?: string | null }): void {
    this.people.onUeaFilter(event.filter);
  }

  save(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.groups.invalid || this.saving()) {
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
    this.submitted.set(false);
    this.error.set(null);
    // Se limpia al final: clear()/push() emiten valueChanges de forma síncrona.
    this.hasUnsavedChanges.set(false);
    if (!isEditable(plan.status)) {
      this.groups.disable({ emitEvent: false });
    }
  }
}
