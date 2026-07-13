import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { StudentSurveyForm } from '../../../../models';
import { EnrollmentSurveyService } from '../../services/enrollment-survey.service';
import { SurveyResponseComponent } from './survey-response.component';

const activeForm: StudentSurveyForm = {
  survey: {
    id: 2,
    term: '26O',
    status: 'ACTIVO',
    opensAt: '2026-10-01T10:00:00.000Z',
    closesAt: '2026-10-10T10:00:00.000Z',
    introMessage: null,
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

  it('toggles UEA selection', async () => {
    const fixture = await setup({ getActiveSurvey: vi.fn(() => of(activeForm)) });
    const c = fixture.componentInstance;
    c.toggleUea(10);
    expect(c.isSelected(10)).toBe(true);
    c.toggleUea(10);
    expect(c.isSelected(10)).toBe(false);
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
    c.toggleUea(10);
    c.submit();
    expect(submitResponse).toHaveBeenCalledWith(2, {
      academicTerm: 'III',
      mode: 'ENROLL_UEAS',
      ueaIds: [10],
    });
  });
});
