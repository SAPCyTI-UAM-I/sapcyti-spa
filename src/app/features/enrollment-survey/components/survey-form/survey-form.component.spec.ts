import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';

import { SurveyResponse } from '../../../../models';
import { EnrollmentSurveyService } from '../../services/enrollment-survey.service';
import { SurveyFormComponent } from './survey-form.component';

function setDateTime(c: SurveyFormComponent, which: 'opens' | 'closes', d: Date): void {
  const p = (n: number): string => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  const time = `${p(d.getHours())}:${p(d.getMinutes())}`;
  if (which === 'opens') {
    c.form.controls.opensDate.setValue(date);
    c.form.controls.opensTime.setValue(time);
  } else {
    c.form.controls.closesDate.setValue(date);
    c.form.controls.closesTime.setValue(time);
  }
}

const survey = (overrides: Partial<SurveyResponse> = {}): SurveyResponse => ({
  id: 2,
  term: '26O',
  status: 'ACTIVO',
  opensAt: '2026-10-01T10:00:00.000Z',
  closesAt: '2026-10-10T10:00:00.000Z',
  introMessage: null,
  responseCount: 0,
  suggestedTerm: null,
  ...overrides,
});

function apiError(status: number, code: string): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: { error: code } });
}

const defaultService = (): Partial<EnrollmentSurveyService> => ({
  hasActiveUeas: vi.fn(() => of(true)),
  listSurveys: vi.fn(() => of([])),
});

describe('SurveyFormComponent', () => {
  async function setup(
    service: Partial<EnrollmentSurveyService>,
    options: { id?: string | null } = {},
  ) {
    const id = options.id === undefined ? '2' : options.id;
    await TestBed.configureTestingModule({
      imports: [SurveyFormComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        MessageService,
        {
          provide: EnrollmentSurveyService,
          useValue: { ...defaultService(), ...service },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => id } } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SurveyFormComponent);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    return { fixture, navigate };
  }

  describe('create mode', () => {
    it('prefills the default intro message when creating a new survey', async () => {
      const { fixture } = await setup({}, { id: null });
      // No translations registered → instant() echoes the key, proving the prefill ran.
      expect(fixture.componentInstance.form.controls.introMessage.value).toBe(
        'ENROLLMENT_SURVEY.FORM.INTRO_DEFAULT',
      );
    });

    it('suggests the next term from the latest survey', async () => {
      const { fixture } = await setup(
        {
          listSurveys: vi.fn(() => of([survey({ term: '26O' })])),
        },
        { id: null },
      );
      expect(fixture.componentInstance.form.controls.term.value).toBe('27I');
    });

    it('leaves the term empty when there is no previous survey', async () => {
      const { fixture } = await setup({ listSurveys: vi.fn(() => of([])) }, { id: null });
      expect(fixture.componentInstance.form.controls.term.value).toBe('');
    });

    it('warns when the UEA catalog has no active UEAs', async () => {
      const { fixture } = await setup({ hasActiveUeas: vi.fn(() => of(false)) }, { id: null });
      expect(fixture.nativeElement.querySelector('[data-testid="no-ueas-warning"]')).not.toBeNull();
    });

    it('creates a valid survey and navigates to its detail', async () => {
      const created = survey({ id: 9, status: 'PROGRAMADO' });
      const createSurvey = vi.fn(() => of(created));
      const { fixture, navigate } = await setup({ createSurvey }, { id: null });
      const c = fixture.componentInstance;
      c.form.patchValue({
        term: '27I',
        opensDate: '2027-01-10',
        opensTime: '09:00',
        closesDate: '2027-01-20',
        closesTime: '18:00',
        introMessage: 'Mensaje introductorio',
      });
      c.submit();
      expect(createSurvey).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith(['/enrollment-survey', 9]);
    });

    it('blocks submit when the form is invalid', async () => {
      const createSurvey = vi.fn();
      const { fixture } = await setup({ createSurvey }, { id: null });
      fixture.componentInstance.submit();
      expect(createSurvey).not.toHaveBeenCalled();
    });

    it('surfaces a duplicate term inline without navigating', async () => {
      const createSurvey = vi.fn(() =>
        throwError(() => apiError(409, 'SURVEY_ALREADY_EXISTS_FOR_TERM')),
      );
      const { fixture, navigate } = await setup({ createSurvey }, { id: null });
      const c = fixture.componentInstance;
      c.form.patchValue({
        term: '27I',
        opensDate: '2027-01-10',
        opensTime: '09:00',
        closesDate: '2027-01-20',
        closesTime: '18:00',
      });
      c.submit();
      expect(c.termError()).toBe('survey_already_exists_for_term');
      expect(c.bannerError()).toBeNull();
      expect(navigate).not.toHaveBeenCalled();
    });

    it('navigates back to the list on cancel', async () => {
      const { fixture, navigate } = await setup({}, { id: null });
      fixture.componentInstance.cancel();
      expect(navigate).toHaveBeenCalledWith(['/enrollment-survey']);
    });
  });

  describe('edit mode', () => {
    it('loads the survey, prefills the form and keeps the term read-only', async () => {
      const loaded = survey({ introMessage: 'Recuerda responder' });
      const { fixture } = await setup({ getSurvey: vi.fn(() => of(loaded)) });
      const c = fixture.componentInstance;
      expect(c.form.controls.term.disabled).toBe(true);
      expect(c.form.controls.term.value).toBe('26O');
      expect(c.form.controls.introMessage.value).toBe('Recuerda responder');
    });

    it('surfaces a load error when the survey is missing', async () => {
      const { fixture } = await setup({
        getSurvey: vi.fn(() => throwError(() => apiError(404, 'SURVEY_NOT_FOUND'))),
      });
      expect(fixture.componentInstance.error()).toBe('survey_not_found');
    });

    it('shows the status tag and the close button, but no reopen button', async () => {
      const { fixture } = await setup({ getSurvey: vi.fn(() => of(survey({ status: 'ACTIVO' }))) });
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="survey-status-tag"]')).not.toBeNull();
      expect(el.querySelector('[data-testid="close-survey"]')).not.toBeNull();
      expect(el.querySelector('[data-testid="reopen-survey"]')).toBeNull();
    });

    it('closes the survey after confirming and navigates to its detail', async () => {
      const closeSurvey = vi.fn(() => of(survey({ status: 'CERRADO' })));
      const { fixture, navigate } = await setup({
        getSurvey: vi.fn(() => of(survey({ status: 'ACTIVO' }))),
        closeSurvey,
      });
      const c = fixture.componentInstance;
      c.openCloseDialog();
      c.confirmClose();
      expect(closeSurvey).toHaveBeenCalledWith(2);
      expect(navigate).toHaveBeenCalledWith(['/enrollment-survey', 2]);
    });

    it('surfaces a close error without navigating', async () => {
      const closeSurvey = vi.fn(() => throwError(() => apiError(409, 'SURVEY_NOT_ACTIVE')));
      const { fixture, navigate } = await setup({
        getSurvey: vi.fn(() => of(survey({ status: 'ACTIVO' }))),
        closeSurvey,
      });
      fixture.componentInstance.confirmClose();
      expect(fixture.componentInstance.error()).toBe('survey_not_active');
      expect(navigate).not.toHaveBeenCalled();
    });

    it('exposes delete only for a scheduled survey without responses', async () => {
      const { fixture } = await setup({
        getSurvey: vi.fn(() => of(survey({ status: 'PROGRAMADO', responseCount: 0 }))),
      });
      expect(fixture.componentInstance.canDelete()).toBe(true);
    });

    it('hides delete when the scheduled survey already has responses', async () => {
      const { fixture } = await setup({
        getSurvey: vi.fn(() => of(survey({ status: 'PROGRAMADO', responseCount: 3 }))),
      });
      expect(fixture.componentInstance.canDelete()).toBe(false);
    });

    it('hides delete for an active survey', async () => {
      const { fixture } = await setup({
        getSurvey: vi.fn(() => of(survey({ status: 'ACTIVO', responseCount: 0 }))),
      });
      expect(fixture.componentInstance.canDelete()).toBe(false);
    });

    it('deletes a scheduled survey after confirming and navigates to the list', async () => {
      const deleteSurvey = vi.fn(() => of(void 0));
      const { fixture, navigate } = await setup({
        getSurvey: vi.fn(() => of(survey({ status: 'PROGRAMADO' }))),
        deleteSurvey,
      });
      const c = fixture.componentInstance;
      c.openDeleteDialog();
      c.confirmDelete();
      expect(deleteSurvey).toHaveBeenCalledWith(2);
      expect(navigate).toHaveBeenCalledWith(['/enrollment-survey']);
    });

    it('surfaces a not-deletable error without navigating', async () => {
      const deleteSurvey = vi.fn(() => throwError(() => apiError(409, 'SURVEY_NOT_DELETABLE')));
      const { fixture, navigate } = await setup({
        getSurvey: vi.fn(() => of(survey({ status: 'PROGRAMADO' }))),
        deleteSurvey,
      });
      fixture.componentInstance.confirmDelete();
      expect(fixture.componentInstance.error()).toBe('survey_not_deletable');
      expect(navigate).not.toHaveBeenCalled();
    });

    it('offers one-click reactivation while a closed survey is still inside its window', async () => {
      const updateSurvey = vi.fn(() => of(survey({ status: 'ACTIVO' })));
      const closedInWindow: SurveyResponse = {
        ...survey({ status: 'CERRADO' }),
        opensAt: new Date(Date.now() - 86_400_000).toISOString(),
        closesAt: new Date(Date.now() + 86_400_000).toISOString(),
      };
      const { fixture, navigate } = await setup({
        getSurvey: vi.fn(() => of(closedInWindow)),
        updateSurvey,
      });
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="reopen-survey"]')).not.toBeNull();
      fixture.componentInstance.reactivate();
      expect(updateSurvey).toHaveBeenCalledWith(2, expect.anything());
      expect(navigate).toHaveBeenCalledWith(['/enrollment-survey', 2]);
    });

    it('hides the reactivate button once the closed survey window is over', async () => {
      const closedExpired: SurveyResponse = {
        ...survey({ status: 'CERRADO' }),
        opensAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
        closesAt: new Date(Date.now() - 86_400_000).toISOString(),
      };
      const { fixture } = await setup({ getSurvey: vi.fn(() => of(closedExpired)) });
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('[data-testid="reopen-survey"]')).toBeNull();
    });

    it('warns when reopening without active UEAs in the catalog', async () => {
      const closedExpired: SurveyResponse = {
        ...survey({ status: 'CERRADO' }),
        opensAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
        closesAt: new Date(Date.now() - 86_400_000).toISOString(),
      };
      const { fixture } = await setup({
        getSurvey: vi.fn(() => of(closedExpired)),
        hasActiveUeas: vi.fn(() => of(false)),
      });
      expect(fixture.nativeElement.querySelector('[data-testid="no-ueas-warning"]')).not.toBeNull();
    });

    it('blocks reopen when the closing date is today, even with a future time', async () => {
      const updateSurvey = vi.fn();
      const { fixture, navigate } = await setup({
        getSurvey: vi.fn(() => of(survey({ status: 'CERRADO' }))),
        updateSurvey,
      });
      const c = fixture.componentInstance;
      const todayLate = new Date();
      todayLate.setHours(23, 59, 0, 0);
      setDateTime(c, 'opens', new Date(Date.now() - 7 * 86_400_000));
      setDateTime(c, 'closes', todayLate);
      c.reopen();
      expect(c.showReopenError()).toBe(true);
      expect(updateSurvey).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
    });

    it('routes Save through the reopen validation for a closed survey', async () => {
      const updateSurvey = vi.fn();
      const { fixture, navigate } = await setup({
        getSurvey: vi.fn(() => of(survey({ status: 'CERRADO' }))),
        updateSurvey,
      });
      const c = fixture.componentInstance;
      setDateTime(c, 'opens', new Date(Date.now() - 7 * 86_400_000));
      setDateTime(c, 'closes', new Date(Date.now() - 3_600_000));
      c.submit();
      expect(c.showReopenError()).toBe(true);
      expect(updateSurvey).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
    });

    it('reopens keeping the past opening date when only the closing date moves forward', async () => {
      const updateSurvey = vi.fn(() => of(survey({ status: 'PROGRAMADO' })));
      const { fixture, navigate } = await setup({
        getSurvey: vi.fn(() => of(survey({ status: 'CERRADO' }))),
        updateSurvey,
      });
      const c = fixture.componentInstance;
      setDateTime(c, 'opens', new Date(Date.now() - 7 * 86_400_000));
      setDateTime(c, 'closes', new Date(Date.now() + 24 * 3_600_000));
      c.reopen();
      expect(c.showReopenError()).toBe(false);
      expect(updateSurvey).toHaveBeenCalledWith(2, expect.anything());
      expect(navigate).toHaveBeenCalledWith(['/enrollment-survey', 2]);
    });

    it('surfaces a reopen API error without navigating', async () => {
      const updateSurvey = vi.fn(() =>
        throwError(() => apiError(400, 'SURVEY_REOPEN_DATES_INVALID')),
      );
      const { fixture, navigate } = await setup({
        getSurvey: vi.fn(() => of(survey({ status: 'CERRADO' }))),
        updateSurvey,
      });
      const c = fixture.componentInstance;
      setDateTime(c, 'opens', new Date(Date.now() - 7 * 86_400_000));
      setDateTime(c, 'closes', new Date(Date.now() + 24 * 3_600_000));
      c.reopen();
      expect(c.error()).toBe('survey_reopen_dates_invalid');
      expect(navigate).not.toHaveBeenCalled();
    });

    it('updates an active survey and navigates to its detail', async () => {
      const updateSurvey = vi.fn(() => of(survey({ status: 'ACTIVO' })));
      const { fixture, navigate } = await setup({
        getSurvey: vi.fn(() => of(survey({ status: 'ACTIVO' }))),
        updateSurvey,
      });
      const c = fixture.componentInstance;
      c.form.controls.introMessage.setValue('Mensaje actualizado');
      c.submit();
      expect(updateSurvey).toHaveBeenCalledWith(2, expect.anything());
      expect(navigate).toHaveBeenCalledWith(['/enrollment-survey', 2]);
    });

    it('navigates back to the survey detail on cancel', async () => {
      const { fixture, navigate } = await setup({
        getSurvey: vi.fn(() => of(survey({ status: 'ACTIVO' }))),
      });
      fixture.componentInstance.cancel();
      expect(navigate).toHaveBeenCalledWith(['/enrollment-survey', 2]);
    });
  });
});
