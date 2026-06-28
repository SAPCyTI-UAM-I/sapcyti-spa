import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { MultiSelect } from 'primeng/multiselect';
import { InputText } from 'primeng/inputtext';
import { finalize, forkJoin } from 'rxjs';

import {
  ProgramStatus,
  ProgramType,
  ProfessorCatalogItem,
  ResearchCatalogOption,
  StudentDetailResponse,
  StudentProgramResponse,
  UpdateStudentProgramRequest,
  UpdateStudentRequest,
  ResearchAreaCatalogItem,
  toLineOfKnowledgeOptions,
  toResearchAreaOptions,
} from '../../../../models';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { StudentService } from '../../services/student.service';
import { StudentProgramService } from '../../services/student-program.service';
import { ProfessorService } from '../../services/professor.service';
import { ResearchCatalogService } from '../../services/research-catalog.service';
import { FieldErrorComponent } from '../../../../shared/components/field-error/field-error.component';
import { formatPersonName } from '../../../../shared/utils/person-name.util';
import { isFieldInvalid } from '../../../../shared/utils/field-error.util';
import {
  graduationDateAfterAdmissionValidator,
  uniqueAdvisorIdsValidator,
  withdrawalReasonWhenBajaValidator,
} from '../../utils/student-program-form.util';
import { professorReferenceToOption, professorToOption } from '../../utils/professor-display.util';
import { STUDENT_PROGRAM_STATUS_OPTIONS } from '../../utils/student-program-filter.options';
import { CATALOG_PROGRAM_TYPE_OPTIONS } from '../../utils/catalog-filter.options';
import { CATALOG_ERROR_I18N_SCOPE, mapCatalogError } from '../../utils/catalog-error.util';
import {
  mapStudentProgramError,
  mapStudentProgramFormError,
} from '../../utils/student-program-error.util';

interface ProfessorOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-student-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    Button,
    InputText,
    Message,
    MultiSelect,
    Select,
    FieldErrorComponent,
  ],
  templateUrl: './student-edit.component.html',
})
export class StudentEditComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(StudentService);
  private readonly programService = inject(StudentProgramService);
  private readonly professorService = inject(ProfessorService);
  private readonly researchCatalogService = inject(ResearchCatalogService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly studentId = Number(this.route.snapshot.paramMap.get('studentId'));

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly error = signal<string | null>(null);
  readonly student = signal<StudentDetailResponse | null>(null);

  readonly professorOptions = signal<ProfessorOption[]>([]);
  readonly professorsLoading = signal(false);

  readonly isFieldInvalid = isFieldInvalid;
  readonly formatPersonName = formatPersonName;
  readonly programTypeOptions = CATALOG_PROGRAM_TYPE_OPTIONS;
  readonly statusOptions = STUDENT_PROGRAM_STATUS_OPTIONS;

  readonly researchCatalog = signal<ResearchAreaCatalogItem[]>([]);
  readonly lineOfKnowledgeOptions = computed<ResearchCatalogOption[]>(() =>
    toLineOfKnowledgeOptions(this.researchCatalog()),
  );

  // Active status options mapped to es/en keys
  readonly activeOptions = [
    { labelKey: 'ACADEMIC_CATALOG.STATUS.ACTIVE', value: true },
    { labelKey: 'ACADEMIC_CATALOG.STATUS.INACTIVE', value: false },
  ];

  private readonly assignedProfessorOptions = signal<ProfessorOption[]>([]);
  private professorSearchTimeout: ReturnType<typeof setTimeout> | undefined;

  // cascades
  readonly lineOfKnowledgeControlValue = signal<string>('');
  readonly filteredResearchAreas = computed<ResearchCatalogOption[]>(() => {
    const selectedLine = this.lineOfKnowledgeControlValue();
    if (!selectedLine) {
      return [];
    }
    return toResearchAreaOptions(this.researchCatalog(), selectedLine);
  });

  readonly form = this.fb.group(
    {
      // Personal data
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      firstLastName: ['', [Validators.required, Validators.maxLength(100)]],
      secondLastName: ['', [Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      nationality: ['', [Validators.required, Validators.maxLength(100)]],
      birthDate: ['', Validators.required],
      phone: ['', [Validators.required, Validators.maxLength(20)]],
      phoneExtension: ['', [Validators.maxLength(10)]],

      // Academic data
      undergraduateDegree: ['', [Validators.required, Validators.maxLength(200)]],
      lastDegreeObtained: ['', [Validators.required, Validators.maxLength(200)]],
      programType: ['MAESTRIA' as ProgramType, Validators.required],
      admissionDate: ['', Validators.required],
      active: [true, Validators.required],

      // Program academic data
      graduationDate: [''],
      status: ['ACTIVO' as ProgramStatus, Validators.required],
      withdrawalReason: ['', [Validators.maxLength(500)]],
      lineOfKnowledge: [''],
      researchArea: [''],
      tutorId: [null as number | null],
      advisorIds: [[] as number[], uniqueAdvisorIdsValidator()],
    },
    {
      validators: [withdrawalReasonWhenBajaValidator(), graduationDateAfterAdmissionValidator()],
    },
  );

  constructor() {
    // Cross validators setup
    this.form.controls.status.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.form.updateValueAndValidity({ emitEvent: false }));
    this.form.controls.admissionDate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.form.updateValueAndValidity({ emitEvent: false }));
    this.form.controls.graduationDate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.form.updateValueAndValidity({ emitEvent: false }));

    // lineOfKnowledge changes reset researchArea
    this.form.controls.lineOfKnowledge.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((line) => {
        this.lineOfKnowledgeControlValue.set(line || '');
        this.form.controls.researchArea.setValue('', { emitEvent: false });
      });

    this.load();
  }

  displayError(): string | null {
    if (this.error()) {
      return this.error();
    }
    if (this.submitted() && this.form.invalid) {
      return mapStudentProgramFormError(this.form);
    }
    return null;
  }

  translateError(key: string): string {
    const programErrors = [
      'date_order',
      'withdrawal_reason_required',
      'duplicate_advisor_ids',
      'validation',
      'program_not_found',
      'professor_not_found',
      'student_not_found',
    ];
    const scope = programErrors.includes(key)
      ? 'ACADEMIC_CATALOG.STUDENT_PROGRAM.ERRORS'
      : CATALOG_ERROR_I18N_SCOPE;
    return this.translate.instant(`${scope}.${key}`);
  }

  onProfessorFilter(event: { filter?: string | null }): void {
    clearTimeout(this.professorSearchTimeout);
    const term = event.filter ?? '';

    this.professorSearchTimeout = setTimeout(() => {
      this.loadProfessors(term);
    }, 300);
  }

  cancel(): void {
    void this.router.navigate(['/academic-catalog/students', this.studentId]);
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const studentBody: UpdateStudentRequest = {
      firstName: value.firstName.trim(),
      firstLastName: value.firstLastName.trim(),
      secondLastName: value.secondLastName.trim() || undefined,
      email: value.email.trim(),
      nationality: value.nationality.trim(),
      birthDate: value.birthDate,
      phone: value.phone.trim(),
      phoneExtension: value.phoneExtension.trim() || undefined,
      undergraduateDegree: value.undergraduateDegree.trim(),
      lastDegreeObtained: value.lastDegreeObtained.trim(),
      programType: value.programType,
      admissionDate: value.admissionDate,
      active: value.active,
    };

    const programBody: UpdateStudentProgramRequest = {
      admissionDate: value.admissionDate,
      graduationDate: value.graduationDate.trim() || undefined,
      lineOfKnowledge: value.lineOfKnowledge || undefined,
      researchArea: value.researchArea || undefined,
      status: value.status,
      withdrawalReason:
        value.status === 'BAJA' ? value.withdrawalReason.trim() || undefined : undefined,
      tutorId: value.tutorId,
      advisorIds: value.advisorIds,
    };

    this.submitting.set(true);

    forkJoin([
      this.service.updateStudent(this.studentId, studentBody),
      this.programService.updateProgram(this.studentId, this.student()!.program.id, programBody),
    ])
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant('ACADEMIC_CATALOG.STUDENTS.EDIT.SAVED'),
            life: 3000,
          });
          void this.router.navigate(['/academic-catalog/students', this.studentId]);
        },
        error: (err) => {
          // Prefer program-specific mapping first so 404 program/professor errors
          // are not flattened into the generic catalog reference_not_found key.
          const programMapped = mapStudentProgramError(err);
          if (programMapped !== 'server' && programMapped !== 'load_failed') {
            this.error.set(programMapped);
            return;
          }

          this.error.set(mapCatalogError(err));
        },
      });
  }

  private load(): void {
    if (!Number.isInteger(this.studentId)) {
      this.loading.set(false);
      this.error.set('student_not_found');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      student: this.service.getStudent(this.studentId),
      professors: this.professorService.listProfessors({ page: 0, size: 30, active: true }),
      catalog: this.researchCatalogService.getResearchCatalog(),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ student, professors, catalog }) => {
          this.researchCatalog.set(catalog);
          this.student.set(student);
          this.assignedProfessorOptions.set(this.collectAssignedProfessorOptions(student.program));
          this.mergeProfessorOptions(professors.content);

          const prog = student.program;
          let initialLine = prog.lineOfKnowledge ?? '';
          let initialArea = prog.researchArea ?? '';

          if (initialLine && !catalog.some((c) => c.line === initialLine)) {
            initialLine = '';
            initialArea = '';
          } else if (initialLine && initialArea) {
            const lineItem = catalog.find((c) => c.line === initialLine);
            if (!lineItem || !lineItem.areas.includes(initialArea)) {
              initialArea = '';
            }
          }

          this.lineOfKnowledgeControlValue.set(initialLine);

          this.form.patchValue({
            firstName: student.firstName,
            firstLastName: student.firstLastName,
            secondLastName: student.secondLastName ?? '',
            email: student.email,
            nationality: student.nationality,
            birthDate: student.birthDate,
            phone: student.phone,
            phoneExtension: student.phoneExtension ?? '',
            undergraduateDegree: student.undergraduateDegree,
            lastDegreeObtained: student.lastDegreeObtained,
            programType: student.programType,
            admissionDate: student.admissionDate,
            active: student.active,
            graduationDate: prog.graduationDate ?? '',
            status: prog.status,
            withdrawalReason: prog.withdrawalReason ?? '',
            lineOfKnowledge: initialLine,
            researchArea: initialArea,
            tutorId: prog.tutorId ?? null,
            advisorIds: [...prog.advisorIds],
          });
        },
        error: (err) => this.error.set(mapCatalogError(err)),
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
