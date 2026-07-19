import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { mockApiError } from '../../../../core/errors/testing/mock-api-error.util';
import { SurveyResponse } from '../../../../models';
import { TrimestralPlanService } from '../../services/trimestral-plan.service';
import { TrimestralPlanNewComponent } from './trimestral-plan-new.component';

function survey(id: number, term: string, status: SurveyResponse['status']): SurveyResponse {
  return {
    id,
    term,
    status,
    opensAt: '2026-01-01T00:00:00Z',
    closesAt: '2026-01-10T00:00:00Z',
    introMessage: null,
    responseCount: 2,
    suggestedTerm: null,
  };
}

const SURVEYS = [
  survey(1, '26I', 'CERRADO'),
  survey(2, '26O', 'ACTIVO'),
  survey(3, '25O', 'CERRADO'),
];

describe('TrimestralPlanNewComponent', () => {
  async function setup(options: { surveyId?: string; generate?: ReturnType<typeof vi.fn> } = {}) {
    const generate = options.generate ?? vi.fn(() => of({ id: 7 }));
    await TestBed.configureTestingModule({
      imports: [TrimestralPlanNewComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: TrimestralPlanService,
          useValue: { listSurveys: vi.fn(() => of(SURVEYS)), generate },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: () => options.surveyId ?? null } },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TrimestralPlanNewComponent);
    fixture.detectChanges();
    return { fixture, generate };
  }

  it('lists only CERRADO surveys, most recent term first', async () => {
    const { fixture } = await setup();

    expect(fixture.componentInstance.closedSurveys().map((s) => s.term)).toEqual(['26I', '25O']);
  });

  it('preselects the survey coming from the ?surveyId shortcut without generating', async () => {
    const { fixture, generate } = await setup({ surveyId: '3' });

    expect(fixture.componentInstance.selectedId()).toBe(3);
    expect(generate).not.toHaveBeenCalled();
  });

  it('generates the plan and navigates to its detail', async () => {
    const { fixture, generate } = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.componentInstance.select(1);
    fixture.componentInstance.generate();

    expect(generate).toHaveBeenCalledWith({ surveyId: 1 });
    expect(navigate).toHaveBeenCalledWith(['/trimestral-planning', 7]);
  });

  it('maps ANNUAL_PLAN_REQUIRED to an inline domain error', async () => {
    const { fixture } = await setup({
      generate: vi.fn(() =>
        throwError(() => mockApiError({ status: 409, error: 'ANNUAL_PLAN_REQUIRED' })),
      ),
    });

    fixture.componentInstance.select(1);
    fixture.componentInstance.generate();

    expect(fixture.componentInstance.error()).toBe('annual_plan_required');
  });
});
