import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

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

const survey = (status: SurveyResponse['status']): SurveyResponse => ({
  id: 2,
  term: '26O',
  status,
  opensAt: '2026-10-01T10:00:00.000Z',
  closesAt: '2026-10-10T10:00:00.000Z',
  introMessage: null,
  responseCount: 0,
  suggestedTerm: null,
});

describe('SurveyFormComponent (edit)', () => {
  async function setup(service: Partial<EnrollmentSurveyService>) {
    await TestBed.configureTestingModule({
      imports: [SurveyFormComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        MessageService,
        {
          provide: EnrollmentSurveyService,
          useValue: { hasActiveUeas: vi.fn(() => of(true)), ...service },
        },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '2' } } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SurveyFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('prefills the default intro message when creating a new survey', async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyFormComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        MessageService,
        {
          provide: EnrollmentSurveyService,
          useValue: {
            listSurveys: vi.fn(() => of([])),
            hasActiveUeas: vi.fn(() => of(true)),
          },
        },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SurveyFormComponent);
    fixture.detectChanges();
    // No translations registered → instant() echoes the key, proving the prefill ran.
    expect(fixture.componentInstance.form.controls.introMessage.value).toBe(
      'ENROLLMENT_SURVEY.FORM.INTRO_DEFAULT',
    );
  });

  it('warns when the UEA catalog has no active UEAs while creating', async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyFormComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        MessageService,
        {
          provide: EnrollmentSurveyService,
          useValue: {
            listSurveys: vi.fn(() => of([])),
            hasActiveUeas: vi.fn(() => of(false)),
          },
        },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SurveyFormComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="no-ueas-warning"]')).not.toBeNull();
  });

  it('keeps the term read-only on edit', async () => {
    const fixture = await setup({ getSurvey: vi.fn(() => of(survey('ACTIVO'))) });
    expect(fixture.componentInstance.form.controls.term.disabled).toBe(true);
  });

  it('shows the status tag and the close button, but no reopen button', async () => {
    const fixture = await setup({ getSurvey: vi.fn(() => of(survey('ACTIVO'))) });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="survey-status-tag"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="close-survey"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="reopen-survey"]')).toBeNull();
  });

  it('closes the survey from the edit screen after confirming', async () => {
    const closeSurvey = vi.fn(() => of(survey('CERRADO')));
    const fixture = await setup({ getSurvey: vi.fn(() => of(survey('ACTIVO'))), closeSurvey });
    const c = fixture.componentInstance;
    c.openCloseDialog();
    expect(c.showCloseDialog()).toBe(true);
    c.confirmClose();
    expect(closeSurvey).toHaveBeenCalledWith(2);
  });

  it('exposes delete only for a scheduled survey without responses', async () => {
    const fixture = await setup({ getSurvey: vi.fn(() => of(survey('PROGRAMADO'))) });
    expect(fixture.componentInstance.canDelete()).toBe(true);
  });

  it('deletes a scheduled survey from the edit screen after confirming', async () => {
    const deleteSurvey = vi.fn(() => of(void 0));
    const fixture = await setup({ getSurvey: vi.fn(() => of(survey('PROGRAMADO'))), deleteSurvey });
    const c = fixture.componentInstance;
    c.openDeleteDialog();
    expect(c.showDeleteDialog()).toBe(true);
    c.confirmDelete();
    expect(deleteSurvey).toHaveBeenCalledWith(2);
  });

  it('offers one-click reactivation while a closed survey is still inside its window', async () => {
    const updateSurvey = vi.fn(() => of(survey('ACTIVO')));
    const closedInWindow: SurveyResponse = {
      ...survey('CERRADO'),
      opensAt: new Date(Date.now() - 86_400_000).toISOString(),
      closesAt: new Date(Date.now() + 86_400_000).toISOString(),
    };
    const fixture = await setup({ getSurvey: vi.fn(() => of(closedInWindow)), updateSurvey });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="reopen-survey"]')).not.toBeNull();
    fixture.componentInstance.reactivate();
    expect(updateSurvey).toHaveBeenCalledWith(2, expect.anything());
  });

  it('hides the reactivate button once the closed survey window is over', async () => {
    const closedExpired: SurveyResponse = {
      ...survey('CERRADO'),
      opensAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      closesAt: new Date(Date.now() - 86_400_000).toISOString(),
    };
    const fixture = await setup({ getSurvey: vi.fn(() => of(closedExpired)) });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="reopen-survey"]')).toBeNull();
  });

  it('blocks reopen when the closing date is today, even with a future time', async () => {
    const updateSurvey = vi.fn();
    const fixture = await setup({ getSurvey: vi.fn(() => of(survey('CERRADO'))), updateSurvey });
    const c = fixture.componentInstance;
    const todayLate = new Date();
    todayLate.setHours(23, 59, 0, 0);
    setDateTime(c, 'opens', new Date(Date.now() - 7 * 86_400_000));
    setDateTime(c, 'closes', todayLate); // same calendar day → invalid regardless of time
    c.reopen();
    expect(c.showReopenError()).toBe(true);
    expect(updateSurvey).not.toHaveBeenCalled();
  });

  it('routes Save through the reopen validation for a closed survey', async () => {
    const updateSurvey = vi.fn();
    const fixture = await setup({ getSurvey: vi.fn(() => of(survey('CERRADO'))), updateSurvey });
    const c = fixture.componentInstance;
    setDateTime(c, 'opens', new Date(Date.now() - 7 * 86_400_000));
    setDateTime(c, 'closes', new Date(Date.now() - 3_600_000)); // 1h in the past
    c.submit();
    expect(c.showReopenError()).toBe(true);
    expect(updateSurvey).not.toHaveBeenCalled();
  });

  it('reopens keeping the past opening date when only the closing date moves forward', async () => {
    const updateSurvey = vi.fn(() => of(survey('PROGRAMADO')));
    const fixture = await setup({ getSurvey: vi.fn(() => of(survey('CERRADO'))), updateSurvey });
    const c = fixture.componentInstance;
    setDateTime(c, 'opens', new Date(Date.now() - 7 * 86_400_000));
    setDateTime(c, 'closes', new Date(Date.now() + 24 * 3_600_000));
    c.reopen();
    expect(c.showReopenError()).toBe(false);
    expect(updateSurvey).toHaveBeenCalledWith(2, expect.anything());
  });
});
