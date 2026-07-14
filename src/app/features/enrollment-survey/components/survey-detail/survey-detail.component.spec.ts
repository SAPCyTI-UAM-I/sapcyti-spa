import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { SurveyResponse, UeaDemandRow } from '../../../../models';
import { EnrollmentSurveyService } from '../../services/enrollment-survey.service';
import { SurveyDetailComponent } from './survey-detail.component';

const survey = (overrides: Partial<SurveyResponse> = {}): SurveyResponse => ({
  id: 2,
  term: '26O',
  status: 'PROGRAMADO',
  opensAt: '2026-10-01T10:00:00.000Z',
  closesAt: '2026-10-10T10:00:00.000Z',
  introMessage: null,
  responseCount: 0,
  suggestedTerm: null,
  ...overrides,
});

const rows: UeaDemandRow[] = [
  { ueaId: 10, clave: 'A', nombre: 'A', tipoFormacion: 'BASICA', creditos: 8, totalResponses: 1 },
  { ueaId: 11, clave: 'B', nombre: 'B', tipoFormacion: 'BASICA', creditos: 6, totalResponses: 5 },
];

describe('SurveyDetailComponent', () => {
  async function setup(service: Partial<EnrollmentSurveyService>) {
    await TestBed.configureTestingModule({
      imports: [SurveyDetailComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: EnrollmentSurveyService, useValue: service },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '2' } } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SurveyDetailComponent);
    fixture.detectChanges();
    return fixture;
  }

  function serviceWith(s: SurveyResponse, respondedCount = 3): Partial<EnrollmentSurveyService> {
    return {
      getSurvey: vi.fn(() => of(s)),
      getResultsSummary: vi.fn(() => of({ eligibleCount: 5, respondedCount, pendingCount: 2 })),
      getResultsUeas: vi.fn(() => of(rows)),
      getResultsUeaStudents: vi.fn(() => of([])),
    };
  }

  it('loads the survey and its inline results', async () => {
    const fixture = await setup(serviceWith(survey({ status: 'ACTIVO' })));
    expect(fixture.componentInstance.survey()?.term).toBe('26O');
    expect(fixture.componentInstance.summary()?.respondedCount).toBe(3);
  });

  it('sorts inline results by demand descending', async () => {
    const fixture = await setup(serviceWith(survey({ status: 'ACTIVO' })));
    expect(fixture.componentInstance.orderedRows().map((r) => r.totalResponses)).toEqual([5, 1]);
    expect(fixture.componentInstance.hasResponses()).toBe(true);
  });

  it('flags the no-responses empty state', async () => {
    const fixture = await setup(serviceWith(survey({ status: 'ACTIVO' }), 0));
    expect(fixture.componentInstance.hasResponses()).toBe(false);
  });

  it('loads interested students for a UEA row', async () => {
    const fixture = await setup(serviceWith(survey({ status: 'ACTIVO' })));
    fixture.componentInstance.openStudents(rows[1]!);
    expect(fixture.componentInstance.selectedUea()?.ueaId).toBe(11);
  });
});
