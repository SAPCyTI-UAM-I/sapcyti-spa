import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { forkJoin, finalize } from 'rxjs';

import {
  ProfessorCatalogItem,
  ProgramStatus,
  StudentProgramResponse,
  UpdateStudentProgramRequest,
} from '../../../../models';
import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import { FieldErrorComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { isFieldInvalid } from '../../../../shared/utils/field-error.util';
import { ProfessorService } from '../../services/professor.service';
import { StudentProgramService } from '../../services/student-program.service';
import { professorReferenceToOption, professorToOption } from '../../utils/professor-display.util';
import { STUDENT_PROGRAM_STATUS_OPTIONS } from '../../utils/student-program-filter.options';
import {
  StudentProgramError,
  mapStudentProgramError,
  mapStudentProgramFormError,
  STUDENT_PROGRAM_ERROR_I18N_SCOPE,
} from '../../utils/student-program-error.util';
import {
  uniqueAdvisorIdsValidator,
  graduationDateAfterAdmissionValidator,
  withdrawalReasonWhenBajaValidator,
} from '../../utils/student-program-form.util';

interface ProfessorOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-student-program-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    Button,
    InputText,
    Message,
    MultiSelect,
    Select,
    FieldErrorComponent,
    DomainErrorMessagePipe,
  ],
  templateUrl: './student-program-edit.component.html',
})
export class StudentProgramEditComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly programService = inject(StudentProgramService);
  private readonly professorService = inject(ProfessorService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly studentId = Number(this.route.snapshot.paramMap.get('studentId'));
  readonly programId = Number(this.route.snapshot.paramMap.get('programId'));

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly error = signal<StudentProgramError | null>(null);
  readonly program = signal<StudentProgramResponse | null>(null);
  readonly professorOptions = signal<ProfessorOption[]>([]);
  readonly professorsLoading = signal(false);

  readonly statusOptions = STUDENT_PROGRAM_STATUS_OPTIONS;
  readonly isFieldInvalid = isFieldInvalid;
  readonly studentProgramErrorScope = STUDENT_PROGRAM_ERROR_I18N_SCOPE;

  private readonly assignedProfessorOptions = signal<ProfessorOption[]>([]);
  private professorSearchTimeout: ReturnType<typeof setTimeout> | undefined;

  readonly form = this.fb.group(
    {
      admissionDate: ['', Validators.required],
      graduationDate: [''],
      researchArea: ['', Validators.maxLength(200)],
      status: ['ACTIVO' as ProgramStatus, Validators.required],
      withdrawalReason: ['', Validators.maxLength(500)],
      tutorId: [null as number | null],
      advisorIds: [[] as number[], uniqueAdvisorIdsValidator()],
    },
    {
      validators: [withdrawalReasonWhenBajaValidator(), graduationDateAfterAdmissionValidator()],
    },
  );

  constructor() {
    this.form.controls.status.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.form.updateValueAndValidity({ emitEvent: false }));
    this.form.controls.admissionDate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.form.updateValueAndValidity({ emitEvent: false }));
    this.form.controls.graduationDate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.form.updateValueAndValidity({ emitEvent: false }));
    this.load();
  }

  displayError(): StudentProgramError | null {
    return (
      this.error() ??
      (this.submitted() && this.form.invalid ? mapStudentProgramFormError(this.form) : null)
    );
  }

  onProfessorFilter(event: { filter?: string | null }): void {
    clearTimeout(this.professorSearchTimeout);
    const term = event.filter ?? '';

    this.professorSearchTimeout = setTimeout(() => {
      this.loadProfessors(term);
    }, 300);
  }

  cancel(): void {
    void this.router.navigate([
      '/academic-catalog/students',
      this.studentId,
      'programs',
      this.programId,
    ]);
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const body: UpdateStudentProgramRequest = {
      admissionDate: value.admissionDate,
      graduationDate: value.graduationDate.trim() || undefined,
      researchArea: value.researchArea.trim() || undefined,
      status: value.status,
      withdrawalReason:
        value.status === 'BAJA' ? value.withdrawalReason.trim() || undefined : undefined,
      tutorId: value.tutorId,
      advisorIds: value.advisorIds,
    };

    this.submitting.set(true);
    this.programService
      .updateProgram(this.studentId, this.programId, body)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant('ACADEMIC_CATALOG.STUDENT_PROGRAM.TOAST.SAVED'),
            life: 3000,
          });
          void this.router.navigate([
            '/academic-catalog/students',
            this.studentId,
            'programs',
            this.programId,
          ]);
        },
        error: (err) => this.error.set(mapStudentProgramError(err)),
      });
  }

  private load(): void {
    if (!Number.isInteger(this.studentId) || !Number.isInteger(this.programId)) {
      this.loading.set(false);
      this.error.set('program_not_found');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      program: this.programService.getProgram(this.studentId, this.programId),
      professors: this.professorService.listProfessors({ page: 0, size: 30, active: true }),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ program, professors }) => {
          this.program.set(program);
          this.assignedProfessorOptions.set(this.collectAssignedProfessorOptions(program));
          this.mergeProfessorOptions(professors.content);
          this.form.patchValue({
            admissionDate: program.admissionDate,
            graduationDate: program.graduationDate ?? '',
            researchArea: program.researchArea ?? '',
            status: program.status,
            withdrawalReason: program.withdrawalReason ?? '',
            tutorId: program.tutorId ?? null,
            advisorIds: [...program.advisorIds],
          });
        },
        error: (err) => this.error.set(mapStudentProgramError(err)),
      });
  }

  private collectAssignedProfessorOptions(program: StudentProgramResponse): ProfessorOption[] {
    const options = new Map<number, ProfessorOption>();

    if (program.tutor) {
      const option = professorReferenceToOption(program.tutor);
      options.set(option.value, option);
    }

    for (const advisor of program.advisors) {
      const option = professorReferenceToOption(advisor);
      options.set(option.value, option);
    }

    return [...options.values()];
  }

  private loadProfessors(search = ''): void {
    this.professorsLoading.set(true);
    this.professorService
      .listProfessors({
        page: 0,
        size: 30,
        active: true,
        search: search.trim() || undefined,
      })
      .pipe(
        finalize(() => this.professorsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => this.mergeProfessorOptions(page.content),
      });
  }

  private mergeProfessorOptions(professors: ProfessorCatalogItem[]): void {
    const options = new Map<number, ProfessorOption>();

    for (const option of this.assignedProfessorOptions()) {
      options.set(option.value, option);
    }

    for (const professor of professors) {
      const option = professorToOption(professor);
      options.set(option.value, option);
    }

    this.professorOptions.set(
      [...options.values()].sort((left, right) => left.label.localeCompare(right.label, 'es')),
    );
  }
}
