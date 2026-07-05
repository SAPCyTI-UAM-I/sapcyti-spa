import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { AnnualPlanDetail, FormatCheckReport } from '../../../../models';
import { AnnualPlanService } from '../../services/annual-plan.service';
import { AnnualPlanWizardComponent } from './annual-plan-wizard.component';

const cleanReport: FormatCheckReport = {
  missingInCatalog: [],
  missingInFile: [],
  nameMismatches: [],
  unknownPrograms: [],
  missingPrograms: [],
};

const createdPlan: AnnualPlanDetail = {
  year: 2028,
  status: 'BORRADOR',
  terms: ['28-I', '28-P', '28-O'],
  entries: [],
};

function apiError(status: number, error: string, message?: string): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: { error, message } });
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

  it('blocks step 1 when the year is invalid', async () => {
    const fixture = await setup();
    fixture.componentInstance.form.controls.year.setValue(null as unknown as number);
    fixture.componentInstance.toStep2();
    expect(fixture.componentInstance.step()).toBe(1);
  });

  it('advances to the report step on a successful check', async () => {
    const check = vi.fn(() => of(cleanReport));
    const fixture = await setup({ check });
    fixture.componentInstance.step.set(2);
    fixture.componentInstance.selectedFile.set(new File(['x'], 'plan.xlsx'));

    fixture.componentInstance.runCheck();

    expect(check).toHaveBeenCalled();
    expect(fixture.componentInstance.step()).toBe(3);
    expect(fixture.componentInstance.reportIsClean()).toBe(true);
  });

  it('shows the backend message on FILE_FORMAT_INVALID', async () => {
    const check = vi.fn(() =>
      throwError(() => apiError(400, 'FILE_FORMAT_INVALID', 'Falta la sección PCyTI')),
    );
    const fixture = await setup({ check });
    fixture.componentInstance.step.set(2);
    fixture.componentInstance.selectedFile.set(new File(['x'], 'plan.xlsx'));

    fixture.componentInstance.runCheck();

    expect(fixture.componentInstance.error()).toBe('file_format_invalid');
    expect(fixture.componentInstance.fileFormatMessage()).toBe('Falta la sección PCyTI');
  });

  it('navigates to the created plan', async () => {
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
