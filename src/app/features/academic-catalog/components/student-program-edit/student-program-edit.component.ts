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
  ProgramStatus,
  StudentProgramResponse,
  UpdateStudentProgramRequest,
} from '../../../../models';
import { FieldErrorComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { isFieldInvalid } from '../../../../shared/utils/field-error.util';
import { ProfessorService } from '../../services/professor.service';
import { StudentProgramService } from '../../services/student-program.service';
import { professorToOption } from '../../utils/professor-display.util';
import { STUDENT_PROGRAM_STATUS_OPTIONS } from '../../utils/student-program-filter.options';
import {
  StudentProgramError,
  mapStudentProgramError,
} from '../../utils/student-program-error.util';
import {
  uniqueAdvisorIdsValidator,
  graduationDateAfterAdmissionValidator,
  withdrawalReasonWhenBajaValidator,
} from '../../utils/student-program-form.util';

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
  readonly professorOptions = signal<{ label: string; value: number }[]>([]);

  readonly statusOptions = STUDENT_PROGRAM_STATUS_OPTIONS;
  readonly isFieldInvalid = isFieldInvalid;

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
    this.load();
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
      professors: this.professorService.listProfessors({ page: 0, size: 100, active: true }),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ program, professors }) => {
          this.program.set(program);
          this.professorOptions.set(professors.content.map(professorToOption));
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
}
