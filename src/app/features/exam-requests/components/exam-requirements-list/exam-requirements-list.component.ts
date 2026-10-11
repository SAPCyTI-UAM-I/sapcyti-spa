import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { catchError, EMPTY, finalize, Observable, Subject, switchMap } from 'rxjs';

import { AuthStateService } from '../../../../core/auth/auth.service';
import {
  Degree,
  ExamOptionsDto,
  ExamRequirementDto,
  ExamRequirementsResponse,
  ExamType,
} from '../../../../models';
import {
  CatalogTagComponent,
  I18nSelectComponent,
  type I18nSelectOption,
  LoadStateComponent,
} from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { ExamRequestService } from '../../services/exam-request.service';
import { degreeTagSeverity } from '../../utils/degree-tag.util';
import { EXAM_REQUEST_ERROR_I18N_SCOPE } from '../../utils/exam-request-error.util';

type LoadTrigger = { kind: 'reload' } | { kind: 'type'; examType: ExamType };

@Component({
  selector: 'app-exam-requirements-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    Button,
    Message,
    CatalogTagComponent,
    I18nSelectComponent,
    LoadStateComponent,
  ],
  templateUrl: './exam-requirements-list.component.html',
})
export class ExamRequirementsListComponent implements OnInit {
  private readonly examRequests = inject(ExamRequestService);
  private readonly auth = inject(AuthStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly load$ = new Subject<LoadTrigger>();

  readonly examTypeForm = this.fb.group({
    examType: this.fb.control<ExamType>('GRADO'),
  });

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly options = signal<ExamOptionsDto | null>(null);
  readonly requirements = signal<ExamRequirementsResponse | null>(null);

  /** Queda en el estado para habilitar carga en HU-65. */
  readonly eligible = computed(
    () => this.options()?.eligible === true && this.requirements()?.eligible === true,
  );

  readonly degree = computed<Degree | null>(
    () => this.options()?.degree ?? this.requirements()?.degree ?? null,
  );

  readonly degreeSeverity = computed(() => {
    const degree = this.degree();
    return degree ? degreeTagSeverity(degree) : 'secondary';
  });

  readonly showIneligible = computed(
    () => this.options() !== null && !this.eligible() && this.loadError() === null,
  );

  readonly visibleRequirements = computed<ExamRequirementDto[]>(() => {
    if (!this.eligible()) {
      return [];
    }

    return this.requirements()?.requirements ?? [];
  });

  readonly eligibilityMessageKey = computed(() => {
    const reason =
      this.options()?.eligibilityReason ?? this.requirements()?.eligibilityReason ?? null;
    if (reason === 'PROGRAM_BAJA') {
      return 'EXAM_REQUEST.ELIGIBILITY.PROGRAM_BAJA';
    }

    if (reason === 'PROGRAM_SUSPENSION') {
      return 'EXAM_REQUEST.ELIGIBILITY.PROGRAM_SUSPENSION';
    }

    return 'EXAM_REQUEST.ERRORS.PROGRAM_NOT_ELIGIBLE';
  });

  readonly errorMessage = computed(() => this.loadError() ?? 'EXAM_REQUEST.STATES.LOAD_ERROR');

  /** Selector solo si el servidor ofrece más de un tipo. */
  readonly showExamTypeSelector = computed(() => (this.options()?.examTypes.length ?? 0) > 1);

  readonly examTypeOptions = computed<I18nSelectOption<ExamType>[]>(() =>
    (this.options()?.examTypes ?? []).map((value) => ({
      labelKey: `EXAM_REQUEST.EXAM_TYPES.${value}`,
      value,
    })),
  );

  readonly requestFolio = computed(() => this.requirements()?.request?.folio ?? null);

  /**
   * Habilitación visual de envío: elegible y todos los required en CARGADO.
   * El POST real pertenece a HU-67; este botón no dispara HTTP.
   */
  readonly canSubmit = computed(() => {
    if (!this.eligible()) {
      return false;
    }

    const items = this.requirements()?.requirements ?? [];
    const requiredItems = items.filter((item) => item.required);
    return requiredItems.length > 0 && requiredItems.every((item) => item.status === 'CARGADO');
  });

  ngOnInit(): void {
    this.load$
      .pipe(
        switchMap((trigger) => this.loadTrigger(trigger)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((requirements) => {
        this.requirements.set(requirements);
        if (
          this.options()?.eligible &&
          requirements.eligible &&
          requirements.requirements.length === 0
        ) {
          this.loadError.set('EXAM_REQUEST.STATES.EMPTY');
        }
      });

    this.examTypeForm.controls.examType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((examType) => this.load$.next({ kind: 'type', examType }));

    this.auth.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      if (!user) {
        this.clearAcademicState();
        return;
      }

      this.reload();
    });
  }

  reload(): void {
    this.load$.next({ kind: 'reload' });
  }

  requirementStatusSeverity(status: ExamRequirementDto['status']): 'success' | 'secondary' {
    return status === 'CARGADO' ? 'success' : 'secondary';
  }

  requirementRequiredSeverity(required: boolean): 'warn' | 'secondary' {
    return required ? 'warn' : 'secondary';
  }

  private loadTrigger(trigger: LoadTrigger): Observable<ExamRequirementsResponse> {
    this.loading.set(true);
    this.loadError.set(null);
    // Evita pintar tarjetas del expediente anterior mientras llega el nuevo.
    this.requirements.set(null);

    const source$ =
      trigger.kind === 'reload'
        ? this.loadOptionsThenRequirements()
        : this.loadRequirements(trigger.examType);

    return source$.pipe(
      finalize(() => this.loading.set(false)),
      catchError((error: unknown) => {
        if (trigger.kind === 'reload') {
          this.options.set(null);
        }
        this.requirements.set(null);
        this.loadError.set(`${EXAM_REQUEST_ERROR_I18N_SCOPE}.${this.examRequests.mapError(error)}`);
        return EMPTY;
      }),
    );
  }

  private loadOptionsThenRequirements(): Observable<ExamRequirementsResponse> {
    return this.examRequests.getOptions().pipe(
      switchMap((options) => {
        this.options.set(options);
        const selected = this.resolveExamType(options.examTypes);
        this.examTypeForm.patchValue({ examType: selected }, { emitEvent: false });
        return this.examRequests.getRequirements(selected);
      }),
    );
  }

  private loadRequirements(examType: ExamType): Observable<ExamRequirementsResponse> {
    const allowed = this.options()?.examTypes ?? [];
    if (!allowed.includes(examType)) {
      return EMPTY;
    }

    return this.examRequests.getRequirements(examType);
  }

  /** Prefiere GRADO si el servidor lo permite; si no, el primer tipo de examTypes. */
  private resolveExamType(examTypes: readonly ExamType[]): ExamType {
    if (examTypes.includes('GRADO')) {
      return 'GRADO';
    }

    return examTypes[0] ?? 'GRADO';
  }

  private clearAcademicState(): void {
    this.options.set(null);
    this.requirements.set(null);
    this.loadError.set(null);
    this.loading.set(false);
    this.examTypeForm.reset({ examType: 'GRADO' }, { emitEvent: false });
  }
}
