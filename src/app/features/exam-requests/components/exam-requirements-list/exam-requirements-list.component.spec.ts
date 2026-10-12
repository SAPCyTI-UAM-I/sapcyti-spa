import { HttpErrorResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';

import { AuthStateService } from '../../../../core/auth/auth.service';
import { mockApiError } from '../../../../core/errors/testing/mock-api-error.util';
import {
  CurrentUser,
  Degree,
  DocumentDto,
  DocumentType,
  ExamOptionsDto,
  ExamPanelResponse,
  ExamRequestDto,
  ExamRequirementDto,
  ExamType,
  SaveDocumentsResponse,
} from '../../../../models';
import { ExamRequestService } from '../../services/exam-request.service';
import { formatUploadedAt } from '../../utils/exam-document-format.util';
import { mapExamRequestError, mapExamRequestWriteError } from '../../utils/exam-request-error.util';
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

function countRequiredPending(items: readonly ExamRequirementDto[]): number {
  return items.filter((item) => item.required && item.status === 'PENDIENTE').length;
}

function buildPayload(
  degree: Degree,
  items: ExamRequirementDto[],
  extras: Partial<ExamOptionsDto> & { requiredPendingCount?: number } = {},
): { options: ExamOptionsDto; panel: ExamPanelResponse } {
  const options: ExamOptionsDto = {
    degree,
    programStatus: extras.programStatus ?? 'EN_INVESTIGACION',
    eligible: extras.eligible ?? true,
    eligibilityReason: extras.eligibilityReason ?? null,
    examTypes: degree === 'DOCTORADO' ? ['GRADO', 'PREDOCTORAL'] : ['GRADO'],
  };
  return {
    options,
    panel: {
      examType: 'GRADO',
      degree,
      programStatus: options.programStatus,
      eligible: options.eligible,
      eligibilityReason: options.eligibilityReason,
      request: null,
      requirements: items,
      requiredPendingCount: extras.requiredPendingCount ?? countRequiredPending(items),
    },
  };
}

function pdfDocument(
  documentType: Exclude<DocumentType, 'ARTICULO'>,
  originalName: string,
  sizeBytes = 204800,
): DocumentDto {
  return {
    id: 88,
    documentType,
    kind: 'PDF',
    originalName,
    externalUrl: null,
    sizeBytes,
    uploadedAt: '2026-10-09T18:00:00Z',
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

function draftRequest(
  items: ExamRequirementDto[],
  extras: Partial<ExamRequestDto> = {},
): ExamRequestDto {
  return {
    id: extras.id ?? 1001,
    examType: extras.examType ?? 'GRADO',
    degree: extras.degree ?? 'MAESTRIA',
    status: extras.status ?? 'BORRADOR',
    folio: extras.folio ?? null,
    version: extras.version ?? 1,
    submittedAt: extras.submittedAt ?? null,
    requirements: extras.requirements ?? items,
    delivery: extras.delivery ?? null,
  };
}

function savedPdfResult(
  documentType: Exclude<DocumentType, 'ARTICULO'>,
  originalName: string,
): Extract<SaveDocumentsResponse['results'][number], { status: 'SAVED' }> {
  return {
    documentType,
    status: 'SAVED',
    document: pdfDocument(documentType, originalName),
  };
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
  let getPanel: ReturnType<typeof vi.fn>;
  let saveDocuments: ReturnType<typeof vi.fn>;

  async function setup(
    payload: {
      options: ExamOptionsDto;
      panel: ExamPanelResponse;
    } | null = buildPayload('MAESTRIA', emanuelItems, { programStatus: 'EGRESADO' }),
  ) {
    user$ = new BehaviorSubject<CurrentUser | null>(student);
    getOptions = vi.fn(() =>
      of(payload?.options ?? buildPayload('MAESTRIA', emanuelItems).options),
    );
    getPanel = vi.fn(() => of(payload?.panel ?? buildPayload('MAESTRIA', emanuelItems).panel));
    saveDocuments = vi.fn();

    await TestBed.configureTestingModule({
      imports: [ExamRequirementsListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        {
          provide: ExamRequestService,
          useValue: {
            getOptions,
            getPanel,
            saveDocuments,
            mapError: mapExamRequestError,
            mapWriteError: mapExamRequestWriteError,
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

    return createListFixture();
  }

  function createListFixture() {
    const fixture = TestBed.createComponent(ExamRequirementsListComponent);
    TestBed.inject(TranslateService).use('es');
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

  function saveButton(
    fixture: ReturnType<typeof TestBed.createComponent<ExamRequirementsListComponent>>,
  ) {
    return fixture.debugElement.query(By.css('[data-testid="exam-save-documents"]'));
  }

  function clickSave(
    fixture: ReturnType<typeof TestBed.createComponent<ExamRequirementsListComponent>>,
  ): void {
    saveButton(fixture).triggerEventHandler('onClick', null);
    fixture.detectChanges();
  }

  it('shows five master requirements and the Emanuel example', async () => {
    const fixture = await setup();

    expect(getPanel).toHaveBeenCalledWith('GRADO');
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

  it('shows English filename prefixes when the active language is en', async () => {
    const fixture = await setup();
    TestBed.inject(TranslateService).use('en');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Thesis_Mtria_Lopez_Alba_Emanuel.pdf');
    expect(fixture.nativeElement.textContent).toContain('Faculty_Committee_Lopez_Alba_Emanuel.pdf');
    expect(fixture.nativeElement.textContent).toContain('Academic_Record_Lopez_Alba_Emanuel.pdf');
    expect(fixture.nativeElement.textContent).not.toContain('Tesis_Mtria_Lopez_Alba_Emanuel.pdf');
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
    getPanel = vi.fn(() => of(buildPayload('MAESTRIA', emanuelItems).panel));

    await TestBed.configureTestingModule({
      imports: [ExamRequirementsListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        {
          provide: ExamRequestService,
          useValue: { getOptions, getPanel, mapError: mapExamRequestError },
        },
        {
          provide: AuthStateService,
          useValue: { currentUser$: user$.asObservable(), getCurrentUser: () => user$.value },
        },
      ],
    }).compileComponents();

    const fixture = createListFixture();

    expect(fixture.componentInstance.loadError()).toBe('EXAM_REQUEST.ERRORS.forbidden');
    expect(cardTypes(fixture)).toEqual([]);
  });

  it('maps a security 403 to the forbidden error state', async () => {
    await TestBed.resetTestingModule();
    user$ = new BehaviorSubject<CurrentUser | null>(student);
    getOptions = vi.fn(() => throwError(() => mockApiError({ status: 403, error: 'FORBIDDEN' })));
    getPanel = vi.fn(() => throwError(() => mockApiError({ status: 401, error: 'UNAUTHORIZED' })));

    await TestBed.configureTestingModule({
      imports: [ExamRequirementsListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        {
          provide: ExamRequestService,
          useValue: { getOptions, getPanel, mapError: mapExamRequestError },
        },
        {
          provide: AuthStateService,
          useValue: { currentUser$: user$.asObservable(), getCurrentUser: () => user$.value },
        },
      ],
    }).compileComponents();

    const fixture = createListFixture();

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
    getPanel = vi.fn(() => of(success.panel));

    await TestBed.configureTestingModule({
      imports: [ExamRequirementsListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        {
          provide: ExamRequestService,
          useValue: { getOptions, getPanel, mapError: mapExamRequestError },
        },
        {
          provide: AuthStateService,
          useValue: { currentUser$: user$.asObservable(), getCurrentUser: () => user$.value },
        },
      ],
    }).compileComponents();

    const fixture = createListFixture();
    expect(cardTypes(fixture)).toEqual([]);

    fixture.debugElement.query(By.css('p-button')).triggerEventHandler('onClick', null);
    fixture.detectChanges();

    expect(getPanel).toHaveBeenCalledTimes(1);
    expect(getPanel).toHaveBeenCalledWith('GRADO');
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
    expect(fixture.componentInstance.panel()).toBeNull();
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
    const predoctoral: ExamPanelResponse = {
      ...grado.panel,
      examType: 'PREDOCTORAL',
      request: {
        id: 6301,
        examType: 'PREDOCTORAL',
        degree: 'DOCTORADO',
        status: 'ENVIADA',
        folio: 'SEG-184201-110001',
        version: 1,
        submittedAt: '2026-03-15T10:00:00.000Z',
        requirements: doctoralItems(false),
        delivery: null,
      },
      requirements: doctoralItems(false),
      requiredPendingCount: countRequiredPending(doctoralItems(false)),
    };

    await TestBed.resetTestingModule();
    user$ = new BehaviorSubject<CurrentUser | null>(student);
    getOptions = vi.fn(() => of(grado.options));
    getPanel = vi.fn((examType: ExamType) =>
      of(examType === 'PREDOCTORAL' ? predoctoral : grado.panel),
    );

    await TestBed.configureTestingModule({
      imports: [ExamRequirementsListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        {
          provide: ExamRequestService,
          useValue: { getOptions, getPanel, mapError: mapExamRequestError },
        },
        {
          provide: AuthStateService,
          useValue: { currentUser$: user$.asObservable(), getCurrentUser: () => user$.value },
        },
      ],
    }).compileComponents();

    const fixture = createListFixture();

    expect(getPanel).toHaveBeenCalledWith('GRADO');
    expect(fixture.debugElement.query(By.css('[data-testid="exam-type-selector"]'))).toBeTruthy();
    expect(fixture.componentInstance.examTypeOptions().map((option) => option.value)).toEqual([
      'GRADO',
      'PREDOCTORAL',
    ]);
    expect(fixture.debugElement.query(By.css('[data-testid="exam-request-folio"]'))).toBeNull();

    fixture.componentInstance.examTypeForm.controls.examType.setValue('PREDOCTORAL');
    fixture.detectChanges();

    expect(getPanel).toHaveBeenCalledWith('PREDOCTORAL');
    expect(cardTypes(fixture)).toHaveLength(6);
    expect(fixture.nativeElement.textContent).toContain('EXAM_REQUEST.LABELS.OPTIONAL');
    expect(fixture.nativeElement.textContent).toContain('SEG-184201-110001');
    expect(fixture.componentInstance.panel()?.examType).toBe('PREDOCTORAL');
    expect(fixture.componentInstance.panel()?.request?.id).toBe(6301);
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
    const predoctoral: ExamPanelResponse = {
      ...grado.panel,
      examType: 'PREDOCTORAL',
      request: {
        id: 6301,
        examType: 'PREDOCTORAL',
        degree: 'DOCTORADO',
        status: 'ENVIADA',
        folio: 'SEG-184201-110001',
        version: 1,
        submittedAt: '2026-03-15T10:00:00.000Z',
        requirements: doctoralItems(false),
        delivery: null,
      },
      requirements: doctoralItems(false),
      requiredPendingCount: countRequiredPending(doctoralItems(false)),
    };
    const grado$ = new Subject<ExamPanelResponse>();
    const predoctoral$ = new Subject<ExamPanelResponse>();

    await TestBed.resetTestingModule();
    user$ = new BehaviorSubject<CurrentUser | null>(student);
    getOptions = vi.fn(() => of(grado.options));
    getPanel = vi.fn((examType: ExamType) =>
      examType === 'PREDOCTORAL' ? predoctoral$.asObservable() : grado$.asObservable(),
    );

    await TestBed.configureTestingModule({
      imports: [ExamRequirementsListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        {
          provide: ExamRequestService,
          useValue: { getOptions, getPanel, mapError: mapExamRequestError },
        },
        {
          provide: AuthStateService,
          useValue: { currentUser$: user$.asObservable(), getCurrentUser: () => user$.value },
        },
      ],
    }).compileComponents();

    const fixture = createListFixture();
    expect(getPanel).toHaveBeenCalledWith('GRADO');

    fixture.componentInstance.examTypeForm.controls.examType.setValue('PREDOCTORAL');
    fixture.detectChanges();
    expect(getPanel).toHaveBeenCalledWith('PREDOCTORAL');

    grado$.next(grado.panel);
    grado$.complete();
    fixture.detectChanges();
    expect(cardTypes(fixture)).toEqual([]);
    expect(fixture.componentInstance.panel()).toBeNull();

    predoctoral$.next(predoctoral);
    predoctoral$.complete();
    fixture.detectChanges();

    expect(fixture.componentInstance.panel()?.examType).toBe('PREDOCTORAL');
    expect(fixture.nativeElement.textContent).toContain('SEG-184201-110001');
    expect(fixture.nativeElement.textContent).toContain('EXAM_REQUEST.LABELS.OPTIONAL');
    expect(
      fixture.componentInstance
        .panel()
        ?.requirements.find((item) => item.documentType === 'ARTICULO')?.required,
    ).toBe(false);
  });

  it('enables submit on PREDOCTORAL when required PDFs are loaded and Articulo is pending', async () => {
    const grado = buildPayload('DOCTORADO', doctoralItems(true));
    const predoctoral: ExamPanelResponse = {
      ...grado.panel,
      examType: 'PREDOCTORAL',
      requirements: markLoaded(doctoralItems(false), PDF_TYPES),
    };

    await TestBed.resetTestingModule();
    user$ = new BehaviorSubject<CurrentUser | null>(student);
    getOptions = vi.fn(() => of(grado.options));
    getPanel = vi.fn((examType: ExamType) =>
      of(examType === 'PREDOCTORAL' ? predoctoral : grado.panel),
    );

    await TestBed.configureTestingModule({
      imports: [ExamRequirementsListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        {
          provide: ExamRequestService,
          useValue: { getOptions, getPanel, mapError: mapExamRequestError },
        },
        {
          provide: AuthStateService,
          useValue: { currentUser$: user$.asObservable(), getCurrentUser: () => user$.value },
        },
      ],
    }).compileComponents();

    const fixture = createListFixture();
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
    const predoctoral: ExamPanelResponse = {
      ...grado.panel,
      examType: 'PREDOCTORAL',
      requirements: doctoralItems(false),
    };

    await TestBed.resetTestingModule();
    user$ = new BehaviorSubject<CurrentUser | null>(student);
    getOptions = vi.fn(() => of(grado.options));
    getPanel = vi.fn((examType: ExamType) =>
      of(examType === 'PREDOCTORAL' ? predoctoral : grado.panel),
    );

    await TestBed.configureTestingModule({
      imports: [ExamRequirementsListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        {
          provide: ExamRequestService,
          useValue: { getOptions, getPanel, mapError: mapExamRequestError },
        },
        {
          provide: AuthStateService,
          useValue: { currentUser$: user$.asObservable(), getCurrentUser: () => user$.value },
        },
      ],
    }).compileComponents();

    const fixture = createListFixture();

    const thesis = pdfFile('Tesis_Docto_Perez_Soto_Luis.pdf');
    dropOnCard(fixture, 'TESIS', [thesis]);
    await flushValidation(fixture);
    expect(fixture.componentInstance.pendingSelections().TESIS).toBeTruthy();

    fixture.componentInstance.examTypeForm.controls.examType.setValue('PREDOCTORAL');
    fixture.detectChanges();

    expect(fixture.componentInstance.pendingSelections()).toEqual({});
    expect(fixture.componentInstance.canSubmit()).toBe(false);
  });

  it('renders the server requiredPendingCount without recounting cards', async () => {
    const items = markLoaded(emanuelItems, ['TESIS', 'SOL_SINODALES', 'HIST_ACAD']).map((item) =>
      item.documentType === 'TESIS'
        ? { ...item, currentDocument: pdfDocument('TESIS', EMANUEL_THESIS) }
        : item,
    );
    const fixture = await setup(
      buildPayload('MAESTRIA', items, { programStatus: 'EGRESADO', requiredPendingCount: 9 }),
    );

    expect(fixture.componentInstance.requiredPendingCount()).toBe(9);
    expect(
      fixture.debugElement.query(By.css('[data-testid="exam-required-pending-count"]')),
    ).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('EXAM_REQUEST.LABELS.REQUIRED_PENDING');
  });

  it('shows persisted PDF metadata with an accessible fallback and hides the upload', async () => {
    const items = emanuelItems.map((item) =>
      item.documentType === 'TESIS'
        ? {
            ...item,
            status: 'CARGADO' as const,
            currentDocument: pdfDocument('TESIS', EMANUEL_THESIS, 204800),
          }
        : item,
    );
    const fixture = await setup(buildPayload('MAESTRIA', items, { programStatus: 'EGRESADO' }));

    expect(
      fixture.debugElement.query(By.css('[data-testid="exam-document-name-TESIS"]')).nativeElement
        .textContent,
    ).toContain(EMANUEL_THESIS);
    expect(
      fixture.debugElement.query(By.css('[data-testid="exam-document-size-TESIS"]')).nativeElement
        .textContent,
    ).toContain('200 KB');
    expect(
      fixture.debugElement.query(By.css('[data-testid="exam-document-uploaded-at-TESIS"]'))
        .nativeElement.textContent,
    ).toContain(formatUploadedAt('2026-10-09T18:00:00Z'));
    expect(
      fixture.debugElement.query(By.css('[data-testid="exam-document-panel-TESIS"]')).attributes[
        'aria-label'
      ],
    ).toBe('EXAM_REQUEST.UPLOAD.PREVIEW_FALLBACK');
    expect(fixture.nativeElement.innerHTML).not.toContain('blob:');
    expect(
      fixture.debugElement.query(
        By.css(
          '[data-testid="exam-requirement-card-TESIS"] [data-testid="exam-document-dropzone"]',
        ),
      ),
    ).toBeNull();
  });

  it('shows an article URL as a link without inventing file size or a PDF thumbnail', async () => {
    const articleUrl = 'https://revista.ejemplo.org/articulo/123';
    const items = doctoralItems(true).map((item) =>
      item.documentType === 'ARTICULO'
        ? {
            ...item,
            status: 'CARGADO' as const,
            currentDocument: {
              id: 90,
              documentType: 'ARTICULO' as const,
              kind: 'URL' as const,
              originalName: null,
              externalUrl: articleUrl,
              sizeBytes: null,
              uploadedAt: '2026-10-09T18:10:00Z',
            },
          }
        : item,
    );
    const fixture = await setup(buildPayload('DOCTORADO', items));
    const link = fixture.debugElement.query(By.css('[data-testid="exam-document-url-ARTICULO"]'));

    expect(link.nativeElement.textContent.trim()).toBe(articleUrl);
    expect(link.attributes['href']).toBe(articleUrl);
    expect(link.attributes['target']).toBe('_blank');
    expect(link.attributes['rel']).toBe('noopener noreferrer');
    expect(fixture.nativeElement.textContent).toContain('EXAM_REQUEST.LABELS.LINK');
    expect(
      fixture.debugElement.query(By.css('[data-testid="exam-document-size-ARTICULO"]')),
    ).toBeNull();
    expect(fixture.nativeElement.innerHTML).not.toContain('blob:');
  });

  it('keeps save disabled when there is nothing valid to persist', async () => {
    const fixture = await setup();

    expect(fixture.componentInstance.canSave()).toBe(false);
    expect(saveButton(fixture).componentInstance.disabled).toBe(true);

    dropOnCard(fixture, 'HIST_ACAD', [pdfFile('historia.pdf')]);
    await flushValidation(fixture);

    expect(fixture.componentInstance.pendingSelections().HIST_ACAD).toBeUndefined();
    expect(fixture.componentInstance.canSave()).toBe(false);
    expect(saveButton(fixture).componentInstance.disabled).toBe(true);
  });

  it('keeps save disabled when the request is not a draft', async () => {
    const payload = buildPayload('MAESTRIA', emanuelItems, { programStatus: 'EGRESADO' });
    const fixture = await setup({
      options: payload.options,
      panel: {
        ...payload.panel,
        request: draftRequest(emanuelItems, { status: 'ENVIADA', version: 2, folio: 'SEG-1' }),
      },
    });
    const thesis = pdfFile(EMANUEL_THESIS);

    dropOnCard(fixture, 'TESIS', [thesis]);
    await flushValidation(fixture);

    expect(fixture.componentInstance.pendingSelections().TESIS).toBeTruthy();
    expect(fixture.componentInstance.canSave()).toBe(false);
    expect(saveButton(fixture).componentInstance.disabled).toBe(true);
    fixture.componentInstance.saveDocuments();
    expect(saveDocuments).not.toHaveBeenCalled();
  });

  it('saves valid selections with one POST and confirms only SAVED items', async () => {
    const thesis = pdfFile(EMANUEL_THESIS);
    const savedItems = emanuelItems.map((item) =>
      item.documentType === 'TESIS'
        ? {
            ...item,
            status: 'CARGADO' as const,
            currentDocument: pdfDocument('TESIS', EMANUEL_THESIS),
          }
        : item,
    );
    const request = draftRequest(savedItems, { version: 1 });
    const response: SaveDocumentsResponse = {
      request,
      version: 1,
      results: [savedPdfResult('TESIS', EMANUEL_THESIS)],
    };
    const fixture = await setup();
    saveDocuments.mockReturnValue(of(response));

    dropOnCard(fixture, 'TESIS', [thesis]);
    await flushValidation(fixture);
    expect(fixture.componentInstance.canSave()).toBe(true);

    clickSave(fixture);
    clickSave(fixture);
    await flushValidation(fixture);

    expect(saveDocuments).toHaveBeenCalledTimes(1);
    expect(saveDocuments).toHaveBeenCalledWith('GRADO', 0, [
      { documentType: 'TESIS', kind: 'PDF', file: thesis },
    ]);
    expect(fixture.componentInstance.pendingSelections().TESIS).toBeUndefined();
    expect(fixture.componentInstance.showSaveDialog()).toBe(true);
    expect(fixture.componentInstance.saveDialogSavedCount()).toBe(1);
    expect(fixture.componentInstance.saveDialogFailed()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('EXAM_REQUEST.SAVE.SUCCESS');
    expect(
      fixture.debugElement.query(By.css('[data-testid="exam-document-name-TESIS"]')),
    ).toBeTruthy();
  });

  it('keeps ERROR items on the card and lists them in the mixed confirmation', async () => {
    const thesis = pdfFile(EMANUEL_THESIS);
    const history = pdfFile('Hist_Acad_Lopez_Alba_Emanuel.pdf');
    const savedItems = emanuelItems.map((item) =>
      item.documentType === 'TESIS'
        ? {
            ...item,
            status: 'CARGADO' as const,
            currentDocument: pdfDocument('TESIS', EMANUEL_THESIS),
          }
        : item,
    );
    const response: SaveDocumentsResponse = {
      request: draftRequest(savedItems, { version: 1 }),
      version: 1,
      results: [
        savedPdfResult('TESIS', EMANUEL_THESIS),
        {
          documentType: 'HIST_ACAD',
          status: 'ERROR',
          error: {
            error: 'INVALID_DOCUMENT_NAME',
            message: 'Raw backend filename rejected',
            details: { expectedName: 'Hist_Acad_Lopez_Alba_Emanuel.pdf' },
          },
        },
      ],
    };
    const fixture = await setup();
    saveDocuments.mockReturnValue(of(response));

    dropOnCard(fixture, 'TESIS', [thesis]);
    dropOnCard(fixture, 'HIST_ACAD', [history]);
    await flushValidation(fixture);

    clickSave(fixture);
    await flushValidation(fixture);

    expect(saveDocuments).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.pendingSelections().TESIS).toBeUndefined();
    expect(fixture.componentInstance.pendingSelections().HIST_ACAD).toEqual({
      documentType: 'HIST_ACAD',
      kind: 'PDF',
      file: history,
    });
    expect(fixture.componentInstance.showSaveDialog()).toBe(true);
    expect(fixture.componentInstance.showAllFailed()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('EXAM_REQUEST.SAVE.MIXED');
    expect(
      fixture.debugElement.query(By.css('[data-testid="exam-save-dialog-errors"]')).nativeElement
        .textContent,
    ).toContain('EXAM_REQUEST.VALIDATION.INVALID_DOCUMENT_NAME');
    expect(
      fixture.debugElement.query(By.css('[data-testid="exam-document-save-error-HIST_ACAD"]'))
        .nativeElement.textContent,
    ).toContain('EXAM_REQUEST.VALIDATION.INVALID_DOCUMENT_NAME');
    expect(fixture.nativeElement.textContent).not.toContain('Raw backend filename rejected');
  });

  it('does not claim success when every result is ERROR and focuses the summary', async () => {
    const thesis = pdfFile(EMANUEL_THESIS);
    const response: SaveDocumentsResponse = {
      request: null,
      version: 0,
      results: [
        {
          documentType: 'TESIS',
          status: 'ERROR',
          error: {
            error: 'INVALID_PDF_CONTENT',
            message: 'PDF magic bytes missing',
          },
        },
      ],
    };
    const fixture = await setup();
    saveDocuments.mockReturnValue(of(response));

    dropOnCard(fixture, 'TESIS', [thesis]);
    await flushValidation(fixture);
    clickSave(fixture);
    await flushValidation(fixture);
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.componentInstance.showSaveDialog()).toBe(false);
    expect(fixture.componentInstance.showAllFailed()).toBe(true);
    expect(fixture.componentInstance.pendingSelections().TESIS).toEqual({
      documentType: 'TESIS',
      kind: 'PDF',
      file: thesis,
    });
    const summary = fixture.nativeElement.querySelector(
      '[data-testid="exam-save-error-summary"]',
    ) as HTMLElement | null;
    expect(summary?.textContent).toContain('EXAM_REQUEST.SAVE.ALL_FAILED');
    expect(summary).toBe(document.activeElement);
    expect(
      fixture.debugElement.query(By.css('[data-testid="exam-document-save-error-TESIS"]'))
        .nativeElement.textContent,
    ).toContain('EXAM_REQUEST.VALIDATION.INVALID_PDF_CONTENT');
    expect(fixture.nativeElement.textContent).not.toContain('PDF magic bytes missing');
  });

  it('reloads the panel after a 409 and does not retry the POST', async () => {
    const thesis = pdfFile(EMANUEL_THESIS);
    const fixture = await setup();
    saveDocuments.mockReturnValue(
      throwError(() =>
        mockApiError({
          status: 409,
          error: 'VERSION_CONFLICT',
          message: 'Version 2 is already stored',
        }),
      ),
    );

    dropOnCard(fixture, 'TESIS', [thesis]);
    await flushValidation(fixture);
    expect(getPanel).toHaveBeenCalledTimes(1);

    clickSave(fixture);
    await flushValidation(fixture);

    expect(saveDocuments).toHaveBeenCalledTimes(1);
    expect(getPanel).toHaveBeenCalledTimes(2);
    expect(getPanel).toHaveBeenLastCalledWith('GRADO');
    expect(
      fixture.debugElement.query(By.css('[data-testid="exam-save-write-error"]')),
    ).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('EXAM_REQUEST.ERRORS.version_conflict');
    expect(fixture.nativeElement.textContent).not.toContain('Version 2 is already stored');
    expect(fixture.componentInstance.showSaveDialog()).toBe(false);
  });

  it('reloads the panel after a network error and leaves retry to the user', async () => {
    const thesis = pdfFile(EMANUEL_THESIS);
    const fixture = await setup();
    saveDocuments.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    dropOnCard(fixture, 'TESIS', [thesis]);
    await flushValidation(fixture);
    clickSave(fixture);
    await flushValidation(fixture);

    expect(saveDocuments).toHaveBeenCalledTimes(1);
    expect(getPanel).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.pendingSelections().TESIS).toEqual({
      documentType: 'TESIS',
      kind: 'PDF',
      file: thesis,
    });
    expect(
      fixture.debugElement.query(By.css('[data-testid="exam-save-write-error"]')),
    ).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('EXAM_REQUEST.ERRORS.generic');
    expect(fixture.componentInstance.canSave()).toBe(true);
  });

  it('sends the draft version and ignores a second click while the POST is in flight', async () => {
    const thesis = pdfFile(EMANUEL_THESIS);
    const payload = buildPayload('MAESTRIA', emanuelItems, { programStatus: 'EGRESADO' });
    const pending$ = new Subject<SaveDocumentsResponse>();
    const fixture = await setup({
      options: payload.options,
      panel: {
        ...payload.panel,
        request: draftRequest(emanuelItems, { version: 3 }),
      },
    });
    saveDocuments.mockReturnValue(pending$.asObservable());

    dropOnCard(fixture, 'TESIS', [thesis]);
    await flushValidation(fixture);
    clickSave(fixture);
    clickSave(fixture);

    expect(saveDocuments).toHaveBeenCalledTimes(1);
    expect(saveDocuments).toHaveBeenCalledWith('GRADO', 3, [
      { documentType: 'TESIS', kind: 'PDF', file: thesis },
    ]);
    expect(fixture.componentInstance.inFlight()).toBe(true);
    expect(fixture.componentInstance.canSave()).toBe(false);
    expect(saveButton(fixture).componentInstance.disabled).toBe(true);

    pending$.next({
      request: draftRequest(
        emanuelItems.map((item) =>
          item.documentType === 'TESIS'
            ? {
                ...item,
                status: 'CARGADO' as const,
                currentDocument: pdfDocument('TESIS', EMANUEL_THESIS),
              }
            : item,
        ),
        { version: 4 },
      ),
      version: 4,
      results: [savedPdfResult('TESIS', EMANUEL_THESIS)],
    });
    pending$.complete();
    await flushValidation(fixture);

    expect(fixture.componentInstance.inFlight()).toBe(false);
    expect(fixture.componentInstance.showSaveDialog()).toBe(true);
  });
});
