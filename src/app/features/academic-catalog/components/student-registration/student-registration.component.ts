import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { finalize, forkJoin, Observable } from 'rxjs';

import { AuthStateService } from '../../../../core/auth/auth.service';
import { DomainErrorMessagePipe } from '../../../../core/errors/pipes/domain-error-message.pipe';
import {
  DegreeLevel,
  getLineOfKnowledgeLabelKey,
  getResearchAreaLabelKey,
  ProfessorCatalogItem,
  RegisterStudentRequest,
  RegisterStudentResponse,
  ResearchAreaCatalogItem,
  ResearchCatalogOption,
  toLineOfKnowledgeOptions,
  toResearchAreaOptions,
} from '../../../../models';
import { FieldErrorComponent, I18nSelectComponent } from '../../../../shared/components';
import { TemporaryPasswordDialogComponent } from '../../../../shared/components';
import { ROUTED_PAGE_HOST } from '../../../../shared/layout/routed-page-host';
import { ProfessorService } from '../../services/professor.service';
import { ResearchCatalogService } from '../../services/research-catalog.service';
import { StudentService } from '../../services/student.service';
import {
  CATALOG_PROGRAM_TYPE_OPTIONS,
  DEGREE_LEVEL_OPTIONS,
} from '../../utils/catalog-filter.options';
import { professorToOption } from '../../utils/professor-display.util';
import { uniqueAdvisorIdsValidator } from '../../utils/student-program-form.util';
import { CatalogRegistrationBase } from '../catalog-registration.base';

interface ProfessorOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-student-registration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: ROUTED_PAGE_HOST,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    Button,
    InputText,
    Select,
    MultiSelect,
    I18nSelectComponent,
    FieldErrorComponent,
    TemporaryPasswordDialogComponent,
    DomainErrorMessagePipe,
  ],
  templateUrl: './student-registration.component.html',
})
export class StudentRegistrationComponent extends CatalogRegistrationBase<RegisterStudentResponse> {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthStateService);
  private readonly service = inject(StudentService);
  private readonly professorService = inject(ProfessorService);
  private readonly researchCatalogService = inject(ResearchCatalogService);

  protected override readonly listRoute = '/academic-catalog/students';
  protected override readonly maxStep = 3;

  readonly programTypes = CATALOG_PROGRAM_TYPE_OPTIONS;
  readonly degreeOptions = DEGREE_LEVEL_OPTIONS;
  readonly lineLabelKey = getLineOfKnowledgeLabelKey;
  readonly areaLabelKey = getResearchAreaLabelKey;

  readonly researchCatalog = signal<ResearchAreaCatalogItem[]>([]);
  readonly catalogLoading = signal(true);
  readonly professorOptions = signal<ProfessorOption[]>([]);
  readonly professorsLoading = signal(false);

  readonly lineOfKnowledgeOptions = computed<ResearchCatalogOption[]>(() =>
    toLineOfKnowledgeOptions(this.researchCatalog()),
  );

  private readonly lineOfKnowledgeControlValue = signal('');
  private professorSearchTimeout: ReturnType<typeof setTimeout> | undefined;

  readonly filteredResearchAreas = computed<ResearchCatalogOption[]>(() => {
    const selectedLine = this.lineOfKnowledgeControlValue();
    if (!selectedLine) {
      return [];
    }
    return toResearchAreaOptions(this.researchCatalog(), selectedLine);
  });

  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    firstLastName: ['', [Validators.required, Validators.maxLength(100)]],
    secondLastName: ['', Validators.maxLength(100)],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    nationality: ['Mexicana', [Validators.required, Validators.maxLength(100)]],
    birthDate: ['', Validators.required],
    phone: ['', [Validators.required, Validators.maxLength(20)]],
    phoneExtension: ['', Validators.maxLength(10)],
    enrollmentId: ['', [Validators.required, Validators.maxLength(20)]],
    undergraduateDegree: ['', [Validators.required, Validators.maxLength(200)]],
    lastDegreeObtained: ['' as DegreeLevel, Validators.required],
    programType: ['', Validators.required],
    admissionDate: ['', Validators.required],
    lineOfKnowledge: [''],
    researchArea: [''],
    tutorId: [null as number | null],
    advisorIds: [[] as number[], uniqueAdvisorIdsValidator()],
  });

  constructor() {
    super();
    this.form.controls.lineOfKnowledge.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((line) => {
        this.lineOfKnowledgeControlValue.set(line || '');
        this.form.controls.researchArea.setValue('', { emitEvent: false });
      });

    forkJoin({
      catalog: this.researchCatalogService.getResearchCatalog(),
      professors: this.professorService.listProfessors({ page: 0, size: 30, active: true }),
    })
      .pipe(
        finalize(() => this.catalogLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ catalog, professors }) => {
          this.researchCatalog.set(catalog);
          this.professorOptions.set(
            professors.content
              .map((professor) => professorToOption(professor))
              .sort((left, right) => left.label.localeCompare(right.label, 'es')),
          );
        },
      });
  }

  professorLabel(id: number | null | undefined): string {
    if (id == null) {
      return '';
    }
    return this.professorOptions().find((option) => option.value === id)?.label ?? '';
  }

  advisorLabels(ids: number[] | null | undefined): string {
    return (ids ?? [])
      .map((id) => this.professorLabel(id))
      .filter(Boolean)
      .join(', ');
  }

  onProfessorFilter(event: { filter?: string | null }): void {
    clearTimeout(this.professorSearchTimeout);
    const term = event.filter ?? '';

    this.professorSearchTimeout = setTimeout(() => {
      this.loadProfessors(term);
    }, 300);
  }

  protected override validateStep(step: number): boolean {
    const controls =
      step === 1
        ? [
            'firstName',
            'firstLastName',
            'secondLastName',
            'email',
            'nationality',
            'birthDate',
            'phone',
            'phoneExtension',
          ]
        : [
            'enrollmentId',
            'undergraduateDegree',
            'lastDegreeObtained',
            'programType',
            'admissionDate',
            'advisorIds',
          ];
    return controls.every((name) => this.form.get(name)?.valid);
  }

  protected override isFormValidForSubmit(): boolean {
    return this.form.valid;
  }

  protected override register(): Observable<RegisterStudentResponse> {
    const value = this.form.getRawValue();
    const advisorIds = value.advisorIds;
    const request: RegisterStudentRequest = {
      ...value,
      secondLastName: value.secondLastName.trim() || undefined,
      phoneExtension: value.phoneExtension.trim() || undefined,
      programType: value.programType as RegisterStudentRequest['programType'],
      graduateProgramId: this.auth.getCurrentUser()?.graduateProgramId ?? 1,
      lineOfKnowledge: value.lineOfKnowledge.trim() || undefined,
      researchArea: value.researchArea.trim() || undefined,
      tutorId: value.tutorId,
      advisorIds: advisorIds.length ? advisorIds : undefined,
    };
    return this.service.registerStudent(request);
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

    for (const option of this.professorOptions()) {
      options.set(option.value, option);
    }

    for (const professor of professors) {
      options.set(professor.id, professorToOption(professor));
    }

    this.professorOptions.set(
      [...options.values()].sort((left, right) => left.label.localeCompare(right.label, 'es')),
    );
  }
}
