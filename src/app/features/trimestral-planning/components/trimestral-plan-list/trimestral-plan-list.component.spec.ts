import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { TrimestralPlanSummary } from '../../../../models';
import { TrimestralPlanService } from '../../services/trimestral-plan.service';
import { TrimestralPlanListComponent } from './trimestral-plan-list.component';

const plan: TrimestralPlanSummary = {
  id: 1,
  term: '26I',
  status: 'BORRADOR',
  surveyId: 1,
  outdated: false,
  exportedAt: null,
  groupCount: 3,
  blankCount: 1,
};

describe('TrimestralPlanListComponent', () => {
  async function setup(list = vi.fn(() => of([plan]))) {
    await TestBed.configureTestingModule({
      imports: [TrimestralPlanListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [provideRouter([]), { provide: TrimestralPlanService, useValue: { list } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(TrimestralPlanListComponent);
    fixture.detectChanges();
    return { fixture, list };
  }

  it('loads and renders the plans', async () => {
    const { fixture } = await setup();

    expect(fixture.componentInstance.plans()).toEqual([plan]);
    expect(fixture.componentInstance.loadError()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('26I');
  });

  it('flags a load error and clears the list', async () => {
    const { fixture } = await setup(
      vi.fn(() => throwError(() => new HttpErrorResponse({ status: 500 }))),
    );

    expect(fixture.componentInstance.plans()).toEqual([]);
    expect(fixture.componentInstance.loadError()).toBe(true);
  });
});
