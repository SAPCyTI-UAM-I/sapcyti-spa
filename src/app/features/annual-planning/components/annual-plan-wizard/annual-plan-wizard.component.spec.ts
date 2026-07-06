import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { AnnualPlanDetail } from '../../../../models';
import { AnnualPlanService } from '../../services/annual-plan.service';
import { AnnualPlanWizardComponent } from './annual-plan-wizard.component';

const createdPlan: AnnualPlanDetail = {
  year: 2028,
  status: 'BORRADOR',
  terms: ['28-I', '28-P', '28-O'],
  entries: [],
};

function apiError(status: number, error: string): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: { error } });
}

describe('AnnualPlanWizardComponent', () => {
  async function setup(service: Partial<AnnualPlanService> = {}) {
    await TestBed.configureTestingModule({
      imports: [AnnualPlanWizardComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [provideRouter([]), { provide: AnnualPlanService, useValue: service }],
    }).compileComponents();
    const fixture = TestBed.createComponent(AnnualPlanWizardComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('does not create when the year is invalid', async () => {
    const create = vi.fn(() => of(createdPlan));
    const fixture = await setup({ create });
    fixture.componentInstance.form.controls.year.setValue(null as unknown as number);

    fixture.componentInstance.create();

    expect(create).not.toHaveBeenCalled();
  });

  it('creates and navigates to the plan (no mandatory Excel check)', async () => {
    const create = vi.fn(() => of(createdPlan));
    const fixture = await setup({ create });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.componentInstance.create();

    expect(create).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/annual-planning', 2028]);
  });

  it('maps a 409 to already_exists', async () => {
    const create = vi.fn(() => throwError(() => apiError(409, 'ANNUAL_PLAN_ALREADY_EXISTS')));
    const fixture = await setup({ create });

    fixture.componentInstance.create();

    expect(fixture.componentInstance.error()).toBe('already_exists');
  });
});
