import { DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';

import { AuthStateService } from '../../../../core/auth/auth.service';
import { mockApiError } from '../../../../core/errors/testing/mock-api-error.util';
import {
  CurrentUser,
  Degree,
  DocumentType,
  ExamOptionsDto,
  ExamRequirementDto,
  ExamRequirementsResponse,
  ExamType,
} from '../../../../models';
import { ExamRequestService } from '../../services/exam-request.service';
import { mapExamRequestError } from '../../utils/exam-request-error.util';
import { ExamDocumentUploadComponent } from '../exam-document-upload/exam-document-upload.component';
import { ExamRequirementsListComponent } from './exam-requirements-list.component';

const EMANUEL_THESIS = 'Tesis_Mtria_Lopez_Alba_Emanuel.pdf';
const PDF_HEADER = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

function pdfFile(name: string): File {
  return new File([PDF_HEADER], name, { type: 'application/octet-stream' });
}

function fileListOf(files: readonly File[]): FileList {
  const list = {
    length: files.length,
    item: (index: number) => files[index] ?? null,
    *[Symbol.iterator]() {
      yield* files;
    },
  };
  files.forEach((file, index) => {
    Object.defineProperty(list, index, { value: file });
  });
  return list as unknown as FileList;
}

const student: CurrentUser = {
  id: 1,
  email: 'student@uam.mx',
  role: 'STUDENT',
  graduateProgramId: 1,
};

function pdfRequirement(
  documentType: Exclude<DocumentType, 'ARTICULO'>,
  exampleName: string,
): ExamRequirementDto {
  return {
    documentType,
    required: true,
    acceptedKinds: ['PDF'],
    expectedName: exampleName,
    exampleName,
    status: 'PENDIENTE',
    currentDocument: null,
  };
}

function articleRequirement(required = true): ExamRequirementDto {
  return {
    documentType: 'ARTICULO',
    required,
    acceptedKinds: ['PDF', 'URL'],
    expectedName: null,
    exampleName: null,
    status: 'PENDIENTE',
    currentDocument: null,
  };
}

function buildPayload(
  degree: Degree,
  items: ExamRequirementDto[],
  extras: Partial<ExamOptionsDto> = {},
): { options: ExamOptionsDto; requirements: ExamRequirementsResponse } {
  const options: ExamOptionsDto = {
    degree,
    programStatus: extras.programStatus ?? 'EN_INVESTIGACION',
    eligible: extras.eligible ?? true,
    eligibilityReason: extras.eligibilityReason ?? null,
    examTypes: degree === 'DOCTORADO' ? ['GRADO', 'PREDOCTORAL'] : ['GRADO'],
  };
  return {
    options,
    requirements: {
      examType: 'GRADO',
      degree,
      programStatus: options.programStatus,
      eligible: options.eligible,
      eligibilityReason: options.eligibilityReason,
      request: null,
      requirements: items,
    },
  };
}

function markLoaded(
  items: ExamRequirementDto[],
  types: readonly DocumentType[],
): ExamRequirementDto[] {
  return items.map((item) =>
    types.includes(item.documentType) ? { ...item, status: 'CARGADO' } : item,
  );
}

const PDF_TYPES: readonly Exclude<DocumentType, 'ARTICULO'>[] = [
  'TESIS',
  'SOL_SINODALES',
  'HIST_ACAD',
  'COMP_IDIOMA',
  'DATOS_ALUM',
];

const doctoralItems = (articleRequired: boolean): ExamRequirementDto[] => [
  pdfRequirement('TESIS', 'Tesis_Docto_Perez_Soto_Luis.pdf'),
  articleRequirement(articleRequired),
  pdfRequirement('SOL_SINODALES', 'Sol_Sinodales_Perez_Soto_Luis.pdf'),
  pdfRequirement('HIST_ACAD', 'Hist_Acad_Perez_Soto_Luis.pdf'),
  pdfRequirement('COMP_IDIOMA', 'Comp_Idioma_Perez_Soto_Luis.pdf'),
  pdfRequirement('DATOS_ALUM', 'Datos_Alum_Perez_Soto_Luis.pdf'),
];

const emanuelItems: ExamRequirementDto[] = [
  pdfRequirement('TESIS', 'Tesis_Mtria_Lopez_Alba_Emanuel.pdf'),
  pdfRequirement('SOL_SINODALES', 'Sol_Sinodales_Lopez_Alba_Emanuel.pdf'),
  pdfRequirement('HIST_ACAD', 'Hist_Acad_Lopez_Alba_Emanuel.pdf'),
  pdfRequirement('COMP_IDIOMA', 'Comp_Idioma_Lopez_Alba_Emanuel.pdf'),
  pdfRequirement('DATOS_ALUM', 'Datos_Alum_Lopez_Alba_Emanuel.pdf'),
];

describe('ExamRequirementsListComponent', () => {
  let user$: BehaviorSubject<CurrentUser | null>;
  let getOptions: ReturnType<typeof vi.fn>;
  let getRequirements: ReturnType<typeof vi.fn>;

  async function setup(
    payload: {
      options: ExamOptionsDto;
      requirements: ExamRequirementsResponse;
    } | null = buildPayload('MAESTRIA', emanuelItems, { programStatus: 'EGRESADO' }),
  ) {
    user$ = new BehaviorSubject<CurrentUser | null>(student);
    getOptions = vi.fn(() =>
      of(payload?.options ?? buildPayload('MAESTRIA', emanuelItems).options),
    );
    getRequirements = vi.fn(() =>
      of(payload?.requirements ?? buildPayload('MAESTRIA', emanuelItems).requirements),
    );

    await TestBed.configureTestingModule({
      imports: [ExamRequirementsListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        {
          provide: ExamRequestService,
          useValue: {
            getOptions,
            getRequirements,
            mapError: mapExamRequestError,
          },
        },
        {
          provide: AuthStateService,
          useValue: {
            currentUser$: user$.asObservable(),
            getCurrentUser: () => user$.value,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ExamRequirementsListComponent);
    fixture.detectChanges();
    return fixture;
  }

  async function flushValidation(
    fixture: ReturnType<typeof TestBed.createComponent<ExamRequirementsListComponent>>,
  ): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function dropOnCard(
    fixture: ReturnType<typeof TestBed.createComponent<ExamRequirementsListComponent>>,
    documentType: DocumentType,
    files: readonly File[],
  ): void {
    const zone = fixture.debugElement.query(
      By.css(
        `[data-testid="exam-requirement-card-${documentType}"] [data-testid="exam-document-dropzone"]`,
      ),
    );
    const event = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'dataTransfer', { value: { files: fileListOf(files) } });
    zone.triggerEventHandler('drop', event);
  }

  function cardTypes(
    fixture: ReturnType<typeof TestBed.createComponent<ExamRequirementsListComponent>>,
  ) {
    return fixture.debugElement
      .queryAll(By.css('[data-testid^="exam-requirement-card-"]'))
      .map((node: DebugElement) =>
        (node.attributes['data-testid'] ?? '').replace('exam-requirement-card-', ''),
      );
  }

  it('shows five master requirements and the Emanuel example', async () => {
    const fixture = await setup();

    expect(getRequirements).toHaveBeenCalledWith('GRADO');
    expect(cardTypes(fixture)).toEqual([
      'TESIS',
      'SOL_SINODALES',
      'HIST_ACAD',
      'COMP_IDIOMA',
      'DATOS_ALUM',
    ]);
    expect(fixture.nativeElement.textContent).toContain('Tesis_Mtria_Lopez_Alba_Emanuel.pdf');
    expect(fixture.componentInstance.eligible()).toBe(true);
  });

  it('shows five specialization types without Articulo', async () => {
    const fixture = await setup(
      buildPayload('ESPECIALIZACION', [
        pdfRequirement('TESIS', 'Tesis_Esp_Garcia_Ruiz_Maria.pdf'),
        pdfRequirement('SOL_SINODALES', 'Sol_Sinodales_Garcia_Ruiz_Maria.pdf'),
        pdfRequirement('HIST_ACAD', 'Hist_Acad_Garcia_Ruiz_Maria.pdf'),
        pdfRequirement('COMP_IDIOMA', 'Comp_Idioma_Garcia_Ruiz_Maria.pdf'),
        pdfRequirement('DATOS_ALUM', 'Datos_Alum_Garcia_Ruiz_Maria.pdf'),
      ]),
    );

    expect(cardTypes(fixture)).toHaveLength(5);
    expect(cardTypes(fixture)).not.toContain('ARTICULO');
    expect(fixture.nativeElement.textContent).toContain('Tesis_Esp_Garcia_Ruiz_Maria.pdf');
  });

  it('shows six doctorate types including Articulo after thesis', async () => {
    const fixture = await setup(buildPayload('DOCTORADO', doctoralItems(true)));

    expect(cardTypes(fixture)).toEqual([
      'TESIS',
      'ARTICULO',
      'SOL_SINODALES',
      'HIST_ACAD',
      'COMP_IDIOMA',
      'DATOS_ALUM',
    ]);
  });

  it('treats an empty requirement list as an integration error', async () => {
    const fixture = await setup(buildPayload('MAESTRIA', []));

    expect(cardTypes(fixture)).toEqual([]);
    expect(fixture.componentInstance.loadError()).toBe('EXAM_REQUEST.STATES.EMPTY');
    expect(fixture.nativeElement.textContent).toContain('EXAM_REQUEST.STATES.EMPTY');
  });

  it('maps a security 401 to the forbidden error state', async () => {
    await TestBed.resetTestingModule();
    user$ = new BehaviorSubject<CurrentUser | null>(student);
    getOptions = vi.fn(() =>
      throwError(() => mockApiError({ status: 401, error: 'UNAUTHORIZED' })),
    );
    getRequirements = vi.fn(() => of(buildPayload('MAESTRIA', emanuelItems).requirements));

    await TestBed.configureTestingModule({
      imports: [ExamRequirementsListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        {
          provide: ExamRequestService,
          useValue: { getOptions, getRequirements, mapError: mapExamRequestError },
        },
        {
          provide: AuthStateService,
          useValue: { currentUser$: user$.asObservable(), getCurrentUser: () => user$.value },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ExamRequirementsListComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.loadError()).toBe('EXAM_REQUEST.ERRORS.forbidden');
    expect(cardTypes(fixture)).toEqual([]);
  });

  it('maps a security 403 to the forbidden error state', async () => {
    await TestBed.resetTestingModule();
    user$ = new BehaviorSubject<CurrentUser | null>(student);
    getOptions = vi.fn(() => throwError(() => mockApiError({ status: 403, error: 'FORBIDDEN' })));
    getRequirements = vi.fn(() =>
      throwError(() => mockApiError({ status: 401, error: 'UNAUTHORIZED' })),
    );

    await TestBed.configureTestingModule({
      imports: [ExamRequirementsListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        {
          provide: ExamRequestService,
          useValue: { getOptions, getRequirements, mapError: mapExamRequestError },
        },
        {
          provide: AuthStateService,
          useValue: { currentUser$: user$.asObservable(), getCurrentUser: () => user$.value },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ExamRequirementsListComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.loadError()).toBe('EXAM_REQUEST.ERRORS.forbidden');
    expect(cardTypes(fixture)).toEqual([]);
  });

  it('retries the GRADO load after a failure', async () => {
    const success = buildPayload('MAESTRIA', emanuelItems, { programStatus: 'EGRESADO' });
    await TestBed.resetTestingModule();
    user$ = new BehaviorSubject<CurrentUser | null>(student);
    getOptions = vi
      .fn()
      .mockReturnValueOnce(throwError(() => mockApiError({ status: 403, error: 'FORBIDDEN' })))
      .mockReturnValueOnce(of(success.options));
    getRequirements = vi.fn(() => of(success.requirements));

    await TestBed.configureTestingModule({
      imports: [ExamRequirementsListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        {
          provide: ExamRequestService,
          useValue: { getOptions, getRequirements, mapError: mapExamRequestError },
        },
        {
          provide: AuthStateService,
          useValue: { currentUser$: user$.asObservable(), getCurrentUser: () => user$.value },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ExamRequirementsListComponent);
    fixture.detectChanges();
    expect(cardTypes(fixture)).toEqual([]);

    fixture.debugElement.query(By.css('p-button')).triggerEventHandler('onClick', null);
    fixture.detectChanges();

    expect(getRequirements).toHaveBeenCalledTimes(1);
    expect(getRequirements).toHaveBeenCalledWith('GRADO');
    expect(cardTypes(fixture)).toContain('TESIS');
  });

  it('clears academic data when the session ends', async () => {
    const fixture = await setup();
    expect(cardTypes(fixture)).toContain('TESIS');

    const thesis = pdfFile(EMANUEL_THESIS);
    dropOnCard(fixture, 'TESIS', [thesis]);
    await flushValidation(fixture);
    expect(fixture.componentInstance.pendingSelections().TESIS).toBeTruthy();

    user$.next(null);
    fixture.detectChanges();

    expect(fixture.componentInstance.options()).toBeNull();
    expect(fixture.componentInstance.requirements()).toBeNull();
    expect(fixture.componentInstance.pendingSelections()).toEqual({});
    expect(fixture.componentInstance.examTypeForm.controls.examType.value).toBe('GRADO');
    expect(cardTypes(fixture)).toEqual([]);
    expect(fixture.nativeElement.textContent).not.toContain('Tesis_Mtria_Lopez_Alba_Emanuel.pdf');
  });

  it('hides cards when the program is not eligible', async () => {
    const fixture = await setup(
      buildPayload('MAESTRIA', emanuelItems, {
        programStatus: 'BAJA',
        eligible: false,
        eligibilityReason: 'PROGRAM_BAJA',
      }),
    );

    expect(fixture.componentInstance.eligible()).toBe(false);
    expect(cardTypes(fixture)).toEqual([]);
    expect(
      fixture.debugElement.query(By.css('[data-testid="exam-ineligible-message"]')),
    ).toBeTruthy();
  });

  it('hides the exam type selector when examTypes has only GRADO', async () => {
    const masters = await setup();
    expect(masters.debugElement.query(By.css('[data-testid="exam-type-selector"]'))).toBeNull();

    await TestBed.resetTestingModule();
    const specialization = await setup(
      buildPayload('ESPECIALIZACION', [
        pdfRequirement('TESIS', 'Tesis_Esp_Garcia_Ruiz_Maria.pdf'),
        pdfRequirement('SOL_SINODALES', 'Sol_Sinodales_Garcia_Ruiz_Maria.pdf'),
        pdfRequirement('HIST_ACAD', 'Hist_Acad_Garcia_Ruiz_Maria.pdf'),
        pdfRequirement('COMP_IDIOMA', 'Comp_Idioma_Garcia_Ruiz_Maria.pdf'),
        pdfRequirement('DATOS_ALUM', 'Datos_Alum_Garcia_Ruiz_Maria.pdf'),
      ]),
    );
    expect(
      specialization.debugElement.query(By.css('[data-testid="exam-type-selector"]')),
    ).toBeNull();
  });

  it('shows both exam types for doctorate and reloads PREDOCTORAL without mixing dossiers', async () => {
    const grado = buildPayload('DOCTORADO', doctoralItems(true));
    const predoctoral: ExamRequirementsResponse = {
      ...grado.requirements,
      examType: 'PREDOCTORAL',
      request: {
        id: 6301,
        examType: 'PREDOCTORAL',
        degree: 'DOCTORADO',
        status: 'ENVIADA',
        folio: 'SEG-184201-110001',
        version: 1,
        submittedAt: '2026-03-15T10:00:00.000Z',
      },
      requirements: doctoralItems(false),
    };

    await TestBed.resetTestingModule();
    user$ = new BehaviorSubject<CurrentUser | null>(student);
    getOptions = vi.fn(() => of(grado.options));
    getRequirements = vi.fn((examType: ExamType) =>
      of(examType === 'PREDOCTORAL' ? predoctoral : grado.requirements),
    );

    await TestBed.configureTestingModule({
      imports: [ExamRequirementsListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        {
          provide: ExamRequestService,
          useValue: { getOptions, getRequirements, mapError: mapExamRequestError },
        },
        {
          provide: AuthStateService,
          useValue: { currentUser$: user$.asObservable(), getCurrentUser: () => user$.value },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ExamRequirementsListComponent);
    fixture.detectChanges();

    expect(getRequirements).toHaveBeenCalledWith('GRADO');
    expect(fixture.debugElement.query(By.css('[data-testid="exam-type-selector"]'))).toBeTruthy();
    expect(fixture.componentInstance.examTypeOptions().map((option) => option.value)).toEqual([
      'GRADO',
      'PREDOCTORAL',
    ]);
    expect(fixture.debugElement.query(By.css('[data-testid="exam-request-folio"]'))).toBeNull();

    fixture.componentInstance.examTypeForm.controls.examType.setValue('PREDOCTORAL');
    fixture.detectChanges();

    expect(getRequirements).toHaveBeenCalledWith('PREDOCTORAL');
    expect(cardTypes(fixture)).toHaveLength(6);
    expect(fixture.nativeElement.textContent).toContain('EXAM_REQUEST.LABELS.OPTIONAL');
    expect(fixture.nativeElement.textContent).toContain('SEG-184201-110001');
    expect(fixture.componentInstance.requirements()?.examType).toBe('PREDOCTORAL');
    expect(fixture.componentInstance.requirements()?.request?.id).toBe(6301);
  });

  it('renders optional and required badges from item.required', async () => {
    const fixture = await setup(buildPayload('DOCTORADO', doctoralItems(true)));

    expect(
      fixture.debugElement.query(By.css('[data-testid="exam-requirement-required-ARTICULO"]')),
    ).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('EXAM_REQUEST.LABELS.REQUIRED');
    expect(fixture.nativeElement.textContent).not.toContain('EXAM_REQUEST.LABELS.OPTIONAL');
  });

  it('discards a late GRADO response after switching to PREDOCTORAL', async () => {
    const grado = buildPayload('DOCTORADO', doctoralItems(true));
    const predoctoral: ExamRequirementsResponse = {
      ...grado.requirements,
      examType: 'PREDOCTORAL',
      request: {
        id: 6301,
        examType: 'PREDOCTORAL',
        degree: 'DOCTORADO',
        status: 'ENVIADA',
        folio: 'SEG-184201-110001',
        version: 1,
        submittedAt: '2026-03-15T10:00:00.000Z',
      },
      requirements: doctoralItems(false),
    };
    const grado$ = new Subject<ExamRequirementsResponse>();
    const predoctoral$ = new Subject<ExamRequirementsResponse>();

    await TestBed.resetTestingModule();
    user$ = new BehaviorSubject<CurrentUser | null>(student);
    getOptions = vi.fn(() => of(grado.options));
    getRequirements = vi.fn((examType: ExamType) =>
      examType === 'PREDOCTORAL' ? predoctoral$.asObservable() : grado$.asObservable(),
    );

    await TestBed.configureTestingModule({
      imports: [ExamRequirementsListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        {
          provide: ExamRequestService,
          useValue: { getOptions, getRequirements, mapError: mapExamRequestError },
        },
        {
          provide: AuthStateService,
          useValue: { currentUser$: user$.asObservable(), getCurrentUser: () => user$.value },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ExamRequirementsListComponent);
    fixture.detectChanges();
    expect(getRequirements).toHaveBeenCalledWith('GRADO');

    fixture.componentInstance.examTypeForm.controls.examType.setValue('PREDOCTORAL');
    fixture.detectChanges();
    expect(getRequirements).toHaveBeenCalledWith('PREDOCTORAL');

    grado$.next(grado.requirements);
    grado$.complete();
    fixture.detectChanges();
    expect(cardTypes(fixture)).toEqual([]);
    expect(fixture.componentInstance.requirements()).toBeNull();

    predoctoral$.next(predoctoral);
    predoctoral$.complete();
    fixture.detectChanges();

    expect(fixture.componentInstance.requirements()?.examType).toBe('PREDOCTORAL');
    expect(fixture.nativeElement.textContent).toContain('SEG-184201-110001');
    expect(fixture.nativeElement.textContent).toContain('EXAM_REQUEST.LABELS.OPTIONAL');
    expect(
      fixture.componentInstance
        .requirements()
        ?.requirements.find((item) => item.documentType === 'ARTICULO')?.required,
    ).toBe(false);
  });

  it('enables submit on PREDOCTORAL when required PDFs are loaded and Articulo is pending', async () => {
    const grado = buildPayload('DOCTORADO', doctoralItems(true));
    const predoctoral: ExamRequirementsResponse = {
      ...grado.requirements,
      examType: 'PREDOCTORAL',
      requirements: markLoaded(doctoralItems(false), PDF_TYPES),
    };

    await TestBed.resetTestingModule();
    user$ = new BehaviorSubject<CurrentUser | null>(student);
    getOptions = vi.fn(() => of(grado.options));
    getRequirements = vi.fn((examType: ExamType) =>
      of(examType === 'PREDOCTORAL' ? predoctoral : grado.requirements),
    );

    await TestBed.configureTestingModule({
      imports: [ExamRequirementsListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        {
          provide: ExamRequestService,
          useValue: { getOptions, getRequirements, mapError: mapExamRequestError },
        },
        {
          provide: AuthStateService,
          useValue: { currentUser$: user$.asObservable(), getCurrentUser: () => user$.value },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ExamRequirementsListComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.canSubmit()).toBe(false);

    fixture.componentInstance.examTypeForm.controls.examType.setValue('PREDOCTORAL');
    fixture.detectChanges();

    expect(fixture.componentInstance.canSubmit()).toBe(true);
    const submit = fixture.debugElement.query(By.css('[data-testid="exam-submit"]'));
    expect(submit).toBeTruthy();
    expect(submit.componentInstance.disabled).toBe(false);
  });

  it('keeps submit disabled on doctoral GRADO while Articulo is still pending', async () => {
    const fixture = await setup(
      buildPayload('DOCTORADO', markLoaded(doctoralItems(true), PDF_TYPES)),
    );

    expect(fixture.componentInstance.canSubmit()).toBe(false);
    const submit = fixture.debugElement.query(By.css('[data-testid="exam-submit"]'));
    expect(submit.componentInstance.disabled).toBe(true);
  });

  it('keeps a valid Emanuel thesis as a pending local selection', async () => {
    const fixture = await setup();
    const thesis = pdfFile(EMANUEL_THESIS);

    dropOnCard(fixture, 'TESIS', [thesis]);
    await flushValidation(fixture);

    expect(fixture.componentInstance.pendingSelections().TESIS).toEqual({
      documentType: 'TESIS',
      kind: 'PDF',
      file: thesis,
    });
    expect(fixture.componentInstance.canSubmit()).toBe(false);
  });

  it('rejects a wrong name and shows the API expectedName without storing it', async () => {
    const fixture = await setup();

    dropOnCard(fixture, 'HIST_ACAD', [pdfFile('historia.pdf')]);
    await flushValidation(fixture);

    const upload = fixture.debugElement
      .query(By.css('[data-testid="exam-requirement-card-HIST_ACAD"]'))
      .query(By.directive(ExamDocumentUploadComponent))
      .componentInstance as ExamDocumentUploadComponent;

    expect(fixture.componentInstance.pendingSelections().HIST_ACAD).toBeUndefined();
    expect(upload.validationError()).toEqual({
      code: 'INVALID_DOCUMENT_NAME',
      key: 'EXAM_REQUEST.VALIDATION.INVALID_DOCUMENT_NAME',
      expectedName: 'Hist_Acad_Lopez_Alba_Emanuel.pdf',
      params: { expectedName: 'Hist_Acad_Lopez_Alba_Emanuel.pdf' },
    });
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="exam-requirement-card-HIST_ACAD"] [data-testid="exam-document-error"]',
      )?.textContent,
    ).toContain('EXAM_REQUEST.VALIDATION.INVALID_DOCUMENT_NAME');
  });

  it('stores a doctoral article HTTPS URL as a pending selection', async () => {
    const fixture = await setup(buildPayload('DOCTORADO', doctoralItems(true)));
    const upload = fixture.debugElement
      .query(By.css('[data-testid="exam-requirement-card-ARTICULO"]'))
      .query(By.directive(ExamDocumentUploadComponent))
      .componentInstance as ExamDocumentUploadComponent;

    upload.kindForm.controls.kind.setValue('URL');
    fixture.detectChanges();
    upload.kindForm.controls.url.setValue('https://revista.ejemplo.org/articulo/123');
    await flushValidation(fixture);

    expect(fixture.componentInstance.pendingSelections().ARTICULO).toEqual({
      documentType: 'ARTICULO',
      kind: 'URL',
      url: 'https://revista.ejemplo.org/articulo/123',
    });
  });

  it('clears pending selections when switching from GRADO to PREDOCTORAL', async () => {
    const grado = buildPayload('DOCTORADO', doctoralItems(true));
    const predoctoral: ExamRequirementsResponse = {
      ...grado.requirements,
      examType: 'PREDOCTORAL',
      requirements: doctoralItems(false),
    };

    await TestBed.resetTestingModule();
    user$ = new BehaviorSubject<CurrentUser | null>(student);
    getOptions = vi.fn(() => of(grado.options));
    getRequirements = vi.fn((examType: ExamType) =>
      of(examType === 'PREDOCTORAL' ? predoctoral : grado.requirements),
    );

    await TestBed.configureTestingModule({
      imports: [ExamRequirementsListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        {
          provide: ExamRequestService,
          useValue: { getOptions, getRequirements, mapError: mapExamRequestError },
        },
        {
          provide: AuthStateService,
          useValue: { currentUser$: user$.asObservable(), getCurrentUser: () => user$.value },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ExamRequirementsListComponent);
    fixture.detectChanges();

    const thesis = pdfFile('Tesis_Docto_Perez_Soto_Luis.pdf');
    dropOnCard(fixture, 'TESIS', [thesis]);
    await flushValidation(fixture);
    expect(fixture.componentInstance.pendingSelections().TESIS).toBeTruthy();

    fixture.componentInstance.examTypeForm.controls.examType.setValue('PREDOCTORAL');
    fixture.detectChanges();

    expect(fixture.componentInstance.pendingSelections()).toEqual({});
    expect(fixture.componentInstance.canSubmit()).toBe(false);
  });
});
