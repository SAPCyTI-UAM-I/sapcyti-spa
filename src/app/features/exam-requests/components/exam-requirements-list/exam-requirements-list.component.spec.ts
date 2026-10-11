import { DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { AuthStateService } from '../../../../core/auth/auth.service';
import { mockApiError } from '../../../../core/errors/testing/mock-api-error.util';
import {
  CurrentUser,
  Degree,
  DocumentType,
  ExamOptionsDto,
  ExamRequirementDto,
  ExamRequirementsResponse,
} from '../../../../models';
import { ExamRequestService } from '../../services/exam-request.service';
import { mapExamRequestError } from '../../utils/exam-request-error.util';
import { ExamRequirementsListComponent } from './exam-requirements-list.component';

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

function articleRequirement(): ExamRequirementDto {
  return {
    documentType: 'ARTICULO',
    required: true,
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
    const fixture = await setup(
      buildPayload('DOCTORADO', [
        pdfRequirement('TESIS', 'Tesis_Docto_Perez_Soto_Luis.pdf'),
        articleRequirement(),
        pdfRequirement('SOL_SINODALES', 'Sol_Sinodales_Perez_Soto_Luis.pdf'),
        pdfRequirement('HIST_ACAD', 'Hist_Acad_Perez_Soto_Luis.pdf'),
        pdfRequirement('COMP_IDIOMA', 'Comp_Idioma_Perez_Soto_Luis.pdf'),
        pdfRequirement('DATOS_ALUM', 'Datos_Alum_Perez_Soto_Luis.pdf'),
      ]),
    );

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
    getRequirements = vi
      .fn()
      .mockReturnValueOnce(throwError(() => mockApiError({ status: 403, error: 'FORBIDDEN' })))
      .mockReturnValueOnce(of(success.requirements));

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

    expect(getRequirements).toHaveBeenCalledTimes(2);
    expect(cardTypes(fixture)).toContain('TESIS');
  });

  it('clears academic data when the session ends', async () => {
    const fixture = await setup();
    expect(cardTypes(fixture)).toContain('TESIS');

    user$.next(null);
    fixture.detectChanges();

    expect(fixture.componentInstance.options()).toBeNull();
    expect(fixture.componentInstance.requirements()).toBeNull();
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
});
