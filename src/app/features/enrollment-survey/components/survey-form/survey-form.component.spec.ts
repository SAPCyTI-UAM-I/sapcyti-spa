import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { SurveyResponse } from '../../../../models';
import { EnrollmentSurveyService } from '../../services/enrollment-survey.service';
import { SurveyFormComponent } from './survey-form.component';

function localStr(d: Date): string {
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
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
        { provide: EnrollmentSurveyService, useValue: service },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '2' } } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SurveyFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('keeps the term read-only on edit', async () => {
    const fixture = await setup({ getSurvey: vi.fn(() => of(survey('ACTIVO'))) });
    expect(fixture.componentInstance.form.controls.term.disabled).toBe(true);
  });

  it('exposes the close action only for an active survey', async () => {
    const fixture = await setup({ getSurvey: vi.fn(() => of(survey('ACTIVO'))) });
    const c = fixture.componentInstance;
    expect(c.isActive()).toBe(true);
    expect(c.isReopen()).toBe(false);
    expect(c.canDelete()).toBe(false);
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

  it('exposes reopen for a closed survey', async () => {
    const fixture = await setup({ getSurvey: vi.fn(() => of(survey('CERRADO'))) });
    expect(fixture.componentInstance.isReopen()).toBe(true);
    expect(fixture.componentInstance.isActive()).toBe(false);
  });

  it('blocks reopen with an error modal when the closing date is under a day away', async () => {
    const updateSurvey = vi.fn();
    const fixture = await setup({ getSurvey: vi.fn(() => of(survey('CERRADO'))), updateSurvey });
    const c = fixture.componentInstance;
    c.form.controls.opensAt.setValue(localStr(new Date(Date.now())));
    c.form.controls.closesAt.setValue(localStr(new Date(Date.now() + 3_600_000))); // 1h < 1 day
    c.reopen();
    expect(c.showReopenError()).toBe(true);
    expect(updateSurvey).not.toHaveBeenCalled();
  });

  it('reopens when the closing date is at least a day away', async () => {
    const updateSurvey = vi.fn(() => of(survey('PROGRAMADO')));
    const fixture = await setup({ getSurvey: vi.fn(() => of(survey('CERRADO'))), updateSurvey });
    const c = fixture.componentInstance;
    c.form.controls.opensAt.setValue(localStr(new Date(Date.now() + 24 * 3_600_000)));
    c.form.controls.closesAt.setValue(localStr(new Date(Date.now() + 3 * 24 * 3_600_000)));
    c.reopen();
    expect(c.showReopenError()).toBe(false);
    expect(updateSurvey).toHaveBeenCalledWith(2, expect.anything());
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
});
