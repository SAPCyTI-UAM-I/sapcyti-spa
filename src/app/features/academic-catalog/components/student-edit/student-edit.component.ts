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
import { finalize, forkJoin, merge } from 'rxjs';

import {
  DegreeLevel,
  ProgramStatus,
  ProgramType,
  ResearchCatalogOption,
  StudentDetailResponse,
  ResearchAreaCatalogItem,
  toLineOfKnowledgeOptions,
  toResearchAreaOptions,
} from '../../../../models';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { TOAST_LIFE } from '../../../../shared/utils/toast.util';
import { StudentService } from '../../services/student.service';
import { StudentProgramService } from '../../services/student-program.service';
import { ProfessorOptionsController } from '../../services/professor-options.controller';
import { ResearchCatalogService } from '../../services/research-catalog.service';
import { FieldErrorComponent } from '../../../../shared/components/field-error/field-error.component';
import { I18nSelectComponent } from '../../../../shared/components';
import { formatPersonName } from '../../../../shared/utils/person-name.util';
import { isFieldInvalid } from '../../../../shared/utils/field-error.util';
import { TERM_PATTERN } from '../../../../shared/utils/term.util';
import {
  buildUpdateStudentProgramRequest,
  buildUpdateStudentRequest,
  graduationDateAfterAdmissionValidator,
  reconcileProgramCatalogSelection,
  uniqueAdvisorIdsValidator,
  withdrawalReasonWhenBajaValidator,
} from '../../utils/student-program-form.util';
import { STUDENT_PROGRAM_STATUS_OPTIONS } from '../../utils/student-program-filter.options';
import {
  CATALOG_PROGRAM_TYPE_OPTIONS,
  DEGREE_LEVEL_OPTIONS,
} from '../../utils/catalog-filter.options';
import { mapCatalogError } from '../../utils/catalog-error.util';
import {
  mapStudentProgramError,
  mapStudentProgramFormError,
  studentEditErrorI18nKey,
} from '../../utils/student-program-error.util';

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
    I18nSelectComponent,
    FieldErrorComponent,
  ],
  providers: [ProfessorOptionsController],
  templateUrl: './student-edit.component.html',
})
export class StudentEditComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(StudentService);
  private readonly programService = inject(StudentProgramService);
  private readonly professorPicker = inject(ProfessorOptionsController);
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

  readonly professorOptions = this.professorPicker.options;
  readonly professorsLoading = this.professorPicker.loading;

  readonly isFieldInvalid = isFieldInvalid;
  readonly formatPersonName = formatPersonName;
  readonly programTypeOptions = CATALOG_PROGRAM_TYPE_OPTIONS;
  readonly degreeOptions = DEGREE_LEVEL_OPTIONS;
  readonly statusOptions = STUDENT_PROGRAM_STATUS_OPTIONS;

  readonly researchCatalog = signal<ResearchAreaCatalogItem[]>([]);
  readonly lineOfKnowledgeOptions = computed<ResearchCatalogOption[]>(() =>
    toLineOfKnowledgeOptions(this.researchCatalog()),
  );

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
      lastDegreeObtained: ['' as DegreeLevel, Validators.required],
      programType: ['MAESTRIA' as ProgramType, Validators.required],
      admissionDate: ['', Validators.required],
      admissionTerm: ['', [Validators.required, Validators.pattern(TERM_PATTERN)]],
      // active se conserva y se envía tal como está en BD; la baja lógica no se edita desde este formulario
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
    // Cross validators: any of these fields re-runs the form-level validators.
    merge(
      this.form.controls.status.valueChanges,
      this.form.controls.admissionDate.valueChanges,
      this.form.controls.graduationDate.valueChanges,
    )
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

  readonly errorI18nKey = studentEditErrorI18nKey;

  onProfessorFilter(event: { filter?: string | null }): void {
    this.professorPicker.onFilter(event.filter);
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
    const studentBody = buildUpdateStudentRequest(value);
    const programBody = buildUpdateStudentProgramRequest(value);

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
            life: TOAST_LIFE.DEFAULT,
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
    this.professorPicker.load();
    forkJoin({
      student: this.service.getStudent(this.studentId),
      catalog: this.researchCatalogService.getResearchCatalog(),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ student, catalog }) => {
          this.researchCatalog.set(catalog);
          this.student.set(student);
          this.professorPicker.pinFromProgram(student.program);

          const prog = student.program;
          const { line: initialLine, area: initialArea } = reconcileProgramCatalogSelection(
            catalog,
            prog.lineOfKnowledge ?? '',
            prog.researchArea ?? '',
          );

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
            // Alumno histórico sin el dato: el campo queda vacío y el coordinador lo captura.
            admissionTerm: student.admissionTerm ?? '',
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
}
