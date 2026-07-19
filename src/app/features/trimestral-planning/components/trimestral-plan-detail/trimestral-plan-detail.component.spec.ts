import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';

import { mockApiError } from '../../../../core/errors/testing/mock-api-error.util';
import { TrimestralPlanDetail, TrimestralPlanStatus } from '../../../../models';
import { TrimestralPlanService } from '../../services/trimestral-plan.service';
import { TrimestralPlanDetailComponent } from './trimestral-plan-detail.component';

function plan(
  status: TrimestralPlanStatus = 'BORRADOR',
  overrides: Partial<TrimestralPlanDetail> = {},
): TrimestralPlanDetail {
  return {
    id: 1,
    term: '26I',
    status,
    surveyId: 1,
    outdated: false,
    warnings: [],
    blankStudents: [],
    groups: [],
    ...overrides,
  };
}

describe('TrimestralPlanDetailComponent', () => {
  async function setup(service: Partial<TrimestralPlanService> = {}) {
    const stub = {
      get: vi.fn(() => of(plan())),
      changeStatus: vi.fn(() => of(plan('TERMINADA'))),
      regenerate: vi.fn(() => of(plan())),
      export: vi.fn(() => of(new Blob(['x']))),
      saveGroups: vi.fn(() => of(plan())),
      searchProfessors: vi.fn(() => of({ content: [] })),
      searchStudents: vi.fn(() => of({ content: [] })),
      ...service,
    };

    await TestBed.configureTestingModule({
      imports: [TrimestralPlanDetailComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        MessageService,
        { provide: TrimestralPlanService, useValue: stub },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TrimestralPlanDetailComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, stub };
  }

  it('loads the plan and marks it editable in BORRADOR', async () => {
    const { component } = await setup();

    expect(component.plan()?.term).toBe('26I');
    expect(component.editable()).toBe(true);
  });

  it('renders one banner per warning', async () => {
    const { fixture } = await setup({
      get: vi.fn(() =>
        of(
          plan('BORRADOR', {
            warnings: [{ code: 'UEA_NO_QUOTA', clave: '2156027' }, { code: 'NO_RESPONSES' }],
          }),
        ),
      ),
    });

    const banners = fixture.nativeElement.querySelectorAll(
      '[data-testid="plan-warnings"] p-message',
    );
    expect(banners).toHaveLength(2);
  });

  it('finishes the plan and swaps to read-only', async () => {
    const { component, stub } = await setup();

    component.finish();

    expect(stub.changeStatus).toHaveBeenCalledWith(1, { status: 'TERMINADA' });
    expect(component.editable()).toBe(false);
  });

  it('only regenerates after the confirmation dialog', async () => {
    const { component, stub } = await setup();

    component.showRegenerateDialog.set(true);
    expect(stub.regenerate).not.toHaveBeenCalled();

    component.confirmRegenerate();
    expect(stub.regenerate).toHaveBeenCalledWith(1);
    expect(component.showRegenerateDialog()).toBe(false);
  });

  it('downloads the export as a blob named after the term', async () => {
    const createObjectURL = vi.fn(() => 'blob:x');
    const revokeObjectURL = vi.fn();
    Object.assign(globalThis.URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(vi.fn());

    const { component, stub } = await setup();
    component.downloadExcel();

    expect(stub.export).toHaveBeenCalledWith(1);
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
    click.mockRestore();
  });

  it('maps a not-editable conflict to its domain key', async () => {
    const { component } = await setup({
      changeStatus: vi.fn(() =>
        throwError(() => mockApiError({ status: 409, error: 'TRIMESTRAL_PLAN_NOT_EDITABLE' })),
      ),
    });

    component.finish();

    expect(component.actionError()).toBe('not_editable');
  });
});
