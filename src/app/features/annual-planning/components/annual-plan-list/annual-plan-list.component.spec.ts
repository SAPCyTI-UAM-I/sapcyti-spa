import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { AnnualPlanSummary } from '../../../../models';
import { AnnualPlanService } from '../../services/annual-plan.service';
import { AnnualPlanListComponent } from './annual-plan-list.component';

const plans: AnnualPlanSummary[] = [
  { year: 2027, status: 'BORRADOR' },
  { year: 2026, status: 'TERMINADA' },
];

describe('AnnualPlanListComponent', () => {
  async function setup(throwErr = false) {
    const list = vi.fn(() =>
      throwErr ? throwError(() => new HttpErrorResponse({ status: 500 })) : of(plans),
    );
    await TestBed.configureTestingModule({
      imports: [AnnualPlanListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [provideRouter([]), { provide: AnnualPlanService, useValue: { list } }],
    }).compileComponents();
    return { fixture: TestBed.createComponent(AnnualPlanListComponent), list };
  }

  it('loads and renders the plans on init', async () => {
    const { fixture, list } = await setup();
    fixture.detectChanges();

    expect(list).toHaveBeenCalled();
    expect(fixture.componentInstance.plans()).toEqual(plans);
    expect(fixture.nativeElement.textContent).toContain('2027');
    expect(fixture.nativeElement.textContent).toContain('2026');
  });

  it('flags a load error when the service fails', async () => {
    const { fixture } = await setup(true);
    fixture.detectChanges();

    expect(fixture.componentInstance.loadError()).toBe(true);
    expect(fixture.componentInstance.plans()).toEqual([]);
    expect(fixture.debugElement.query(By.css('app-load-state'))).toBeTruthy();
  });
});
