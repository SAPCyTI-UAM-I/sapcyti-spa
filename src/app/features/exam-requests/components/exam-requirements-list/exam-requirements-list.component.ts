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
import { TranslatePipe } from '@ngx-translate/core';
import { Message } from 'primeng/message';
import { catchError, EMPTY, finalize, forkJoin, Subject, switchMap } from 'rxjs';

import { AuthStateService } from '../../../../core/auth/auth.service';
import {
  Degree,
  ExamOptionsDto,
  ExamRequirementDto,
  ExamRequirementsResponse,
} from '../../../../models';
import { CatalogTagComponent, LoadStateComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { ExamRequestService } from '../../services/exam-request.service';
import { degreeTagSeverity } from '../../utils/degree-tag.util';
import { EXAM_REQUEST_ERROR_I18N_SCOPE } from '../../utils/exam-request-error.util';

@Component({
  selector: 'app-exam-requirements-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [TranslatePipe, Message, CatalogTagComponent, LoadStateComponent],
  templateUrl: './exam-requirements-list.component.html',
})
export class ExamRequirementsListComponent implements OnInit {
  private readonly examRequests = inject(ExamRequestService);
  private readonly auth = inject(AuthStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload$ = new Subject<void>();

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

  ngOnInit(): void {
    this.reload$
      .pipe(
        switchMap(() => {
          this.loading.set(true);
          this.loadError.set(null);
          return forkJoin({
            options: this.examRequests.getOptions(),
            requirements: this.examRequests.getRequirements('GRADO'),
          }).pipe(
            finalize(() => this.loading.set(false)),
            catchError((error: unknown) => {
              this.options.set(null);
              this.requirements.set(null);
              this.loadError.set(
                `${EXAM_REQUEST_ERROR_I18N_SCOPE}.${this.examRequests.mapError(error)}`,
              );
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ options, requirements }) => {
        this.options.set(options);
        this.requirements.set(requirements);
        if (options.eligible && requirements.eligible && requirements.requirements.length === 0) {
          this.loadError.set('EXAM_REQUEST.STATES.EMPTY');
        }
      });

    this.auth.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      if (!user) {
        this.clearAcademicState();
        return;
      }

      this.reload();
    });
  }

  reload(): void {
    this.reload$.next();
  }

  requirementStatusSeverity(status: ExamRequirementDto['status']): 'success' | 'secondary' {
    return status === 'CARGADO' ? 'success' : 'secondary';
  }

  private clearAcademicState(): void {
    this.options.set(null);
    this.requirements.set(null);
    this.loadError.set(null);
    this.loading.set(false);
  }
}
