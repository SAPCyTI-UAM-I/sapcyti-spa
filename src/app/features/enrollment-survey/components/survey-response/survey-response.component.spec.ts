import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { StudentSurveyForm, SurveyResponse } from '../../../../models';
import { EnrollmentSurveyService } from '../../services/enrollment-survey.service';
import { SurveyResponseComponent } from './survey-response.component';

const activeForm: StudentSurveyForm = {
  survey: {
    id: 2,
    term: '26O',
    status: 'ACTIVO',
    opensAt: '2026-10-01T10:00:00.000Z',
    closesAt: '2026-10-10T10:00:00.000Z',
    introMessage: 'Recuerda que este sondeo no equivale a una inscripción oficial.',
    responseCount: 3,
    suggestedTerm: null,
  },
  student: { fullName: 'Ana López', enrollmentId: '2024630001', programType: 'MAESTRIA' },
  availableUeas: [
    { id: 10, clave: 'UEA-101', nombre: 'Métodos', creditos: 8 },
    { id: 11, clave: 'UEA-102', nombre: 'Estadística', creditos: 6 },
  ],
  removedUeaClaves: ['UEA-301'],
  myResponse: null,
};

function formWith(
  overrides: {
    survey?: Partial<SurveyResponse>;
    student?: Partial<StudentSurveyForm['student']>;
    availableUeas?: StudentSurveyForm['availableUeas'];
    removedUeaClaves?: string[];
    myResponse?: StudentSurveyForm['myResponse'];
  } = {},
): StudentSurveyForm {
  return {
    ...activeForm,
    ...overrides,
    survey: { ...activeForm.survey, ...overrides.survey },
    student: { ...activeForm.student, ...overrides.student },
  };
}

describe('SurveyResponseComponent', () => {
  async function setup(service: Partial<EnrollmentSurveyService>) {
    await TestBed.configureTestingModule({
      imports: [SurveyResponseComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        MessageService,
        { provide: EnrollmentSurveyService, useValue: service },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SurveyResponseComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('loads the active form and exposes removed UEA claves', async () => {
    const fixture = await setup({ getActiveSurvey: vi.fn(() => of(activeForm)) });
    expect(fixture.componentInstance.data()?.removedUeaClaves).toEqual(['UEA-301']);
  });

  it('renders the survey shell with intro banner, student card, and removed-UEA warning', async () => {
    const fixture = await setup({ getActiveSurvey: vi.fn(() => of(activeForm)) });
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[data-testid="survey-response"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="intro-message"]')?.textContent).toContain(
      activeForm.survey.introMessage,
    );
    expect(el.querySelector('[data-testid="student-card"]')?.textContent).toContain('Ana López');
    expect(el.querySelector('[data-testid="student-card"]')?.textContent).toContain('2024630001');
    expect(el.querySelector('[data-testid="removed-ueas-banner"]')?.textContent).toContain(
      'UEA-301',
    );
    expect(el.querySelector('[data-testid="submit-response"]')).not.toBeNull();
  });

  it('omits the intro banner when the survey has no intro message', async () => {
    const fixture = await setup({
      getActiveSurvey: vi.fn(() => of(formWith({ survey: { introMessage: null } }))),
    });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="intro-message"]')).toBeNull();
    expect(el.querySelector('[data-testid="student-card"]')).not.toBeNull();
  });

  it('shows a read-only view without the submit form when the survey is closed', async () => {
    const fixture = await setup({
      getActiveSurvey: vi.fn(() =>
        of(
          formWith({
            survey: { status: 'CERRADO' },
            myResponse: {
              academicTerm: 'III',
              mode: 'ENROLL_UEAS',
              ueaIds: [10],
              totalUeas: 1,
              submittedAt: '2026-10-05T10:00:00.000Z',
            },
          }),
        ),
      ),
    });
    const el = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.readonlyView()).toBe(true);
    expect(el.querySelector('[data-testid="submit-response"]')).toBeNull();
    expect(el.textContent).toContain('III');
  });

  it('moves a UEA between the available and selected lists (mutually exclusive)', async () => {
    const fixture = await setup({ getActiveSurvey: vi.fn(() => of(activeForm)) });
    const c = fixture.componentInstance;
    const uea = activeForm.availableUeas[0]!;

    c.addUea(uea);
    expect(c.selectedUeas().map((u) => u.id)).toEqual([10]);
    expect(c.availableUeas().map((u) => u.id)).toEqual([11]); // no longer in the general list

    c.removeUea(uea);
    expect(c.selectedUeas()).toEqual([]);
    expect(c.availableUeas().map((u) => u.id)).toEqual([10, 11]);
  });

  it('filters the available list by clave or nombre', async () => {
    const fixture = await setup({ getActiveSurvey: vi.fn(() => of(activeForm)) });
    const c = fixture.componentInstance;
    c.search.set('estad');
    expect(c.availableUeas().map((u) => u.id)).toEqual([11]);
  });

  it('defaults the mode to ENROLL_UEAS', async () => {
    const fixture = await setup({ getActiveSurvey: vi.fn(() => of(activeForm)) });
    expect(fixture.componentInstance.form.controls.mode.value).toBe('ENROLL_UEAS');
    expect(fixture.componentInstance.isBlank()).toBe(false);
  });

  it('disables the UEA control when the blank mode is chosen', async () => {
    const fixture = await setup({ getActiveSurvey: vi.fn(() => of(activeForm)) });
    const c = fixture.componentInstance;
    c.form.controls.mode.setValue('BLANK');
    expect(c.form.controls.ueaIds.disabled).toBe(true);
    expect(c.isBlank()).toBe(true);
  });

  it('blocks submit when enrolling without any UEA', async () => {
    const submitResponse = vi.fn();
    const fixture = await setup({
      getActiveSurvey: vi.fn(() => of(activeForm)),
      submitResponse,
    });
    const c = fixture.componentInstance;
    c.form.controls.academicTerm.setValue('III');
    c.form.controls.mode.setValue('ENROLL_UEAS');
    c.submit();
    expect(c.form.hasError('ueaRequired')).toBe(true);
    expect(submitResponse).not.toHaveBeenCalled();
  });

  it('submits a valid enrollment response', async () => {
    const submitResponse = vi.fn(() =>
      of({
        academicTerm: 'III',
        mode: 'ENROLL_UEAS' as const,
        ueaIds: [10],
        totalUeas: 1,
        submittedAt: '',
      }),
    );
    const fixture = await setup({
      getActiveSurvey: vi.fn(() => of(activeForm)),
      submitResponse,
    });
    const c = fixture.componentInstance;
    c.form.controls.academicTerm.setValue('III');
    c.form.controls.mode.setValue('ENROLL_UEAS');
    c.addUea(activeForm.availableUeas[0]!);
    c.submit();
    expect(submitResponse).toHaveBeenCalledWith(2, {
      academicTerm: 'III',
      mode: 'ENROLL_UEAS',
      ueaIds: [10],
    });
  });
});
