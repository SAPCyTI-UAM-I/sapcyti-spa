import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';

import { AnnualPlanDetail, AnnualPlanSummary } from '../../../../models';
import { AnnualPlanService } from '../../services/annual-plan.service';
import { AnnualPlanDetailComponent } from './annual-plan-detail.component';

const plan: AnnualPlanDetail = {
  year: 2027,
  status: 'BORRADOR',
  terms: ['27-I', '27-P', '27-O'],
  entries: [
    {
      id: 1,
      ueaId: 1,
      clave: '2156024',
      nombre: 'Redes',
      modalidad: 'MIXTA',
      gruposI: '1',
      cupoI: '15',
      gruposP: null,
      cupoP: null,
      gruposO: null,
      cupoO: null,
      marks: { PCYTI: 'X' },
    },
  ],
};

describe('AnnualPlanDetailComponent', () => {
  async function setup(service: Partial<AnnualPlanService>) {
    await TestBed.configureTestingModule({
      imports: [AnnualPlanDetailComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AnnualPlanService, useValue: service },
        MessageService,
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '2027' } } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AnnualPlanDetailComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('loads the plan and derives the adjacent status action', async () => {
    const fixture = await setup({ get: vi.fn(() => of(plan)) });

    expect(fixture.componentInstance.plan()).toEqual(plan);
    expect(fixture.componentInstance.statusActions()).toEqual([
      { target: 'TERMINADA', labelKey: 'ANNUAL_PLANNING.ACTIONS.FINISH' },
    ]);
  });

  it('changes status then reloads the plan', async () => {
    const get = vi.fn(() => of(plan));
    const summary: AnnualPlanSummary = { year: 2027, status: 'TERMINADA' };
    const changeStatus = vi.fn(() => of(summary));
    const fixture = await setup({ get, changeStatus });

    fixture.componentInstance.askStatusChange('TERMINADA');
    fixture.componentInstance.confirmStatusChange();

    expect(changeStatus).toHaveBeenCalledWith(2027, { status: 'TERMINADA' });
    expect(fixture.componentInstance.pendingStatus()).toBeNull();
    expect(get).toHaveBeenCalledTimes(2); // initial load + reload
  });

  it('surfaces an invalid transition error inline', async () => {
    const changeStatus = vi.fn(() =>
      throwError(
        () => new HttpErrorResponse({ status: 409, error: { error: 'INVALID_STATUS_TRANSITION' } }),
      ),
    );
    const fixture = await setup({ get: vi.fn(() => of(plan)), changeStatus });

    fixture.componentInstance.askStatusChange('TERMINADA');
    fixture.componentInstance.confirmStatusChange();

    expect(fixture.componentInstance.actionError()).toBe('invalid_transition');
    expect(fixture.componentInstance.pendingStatus()).toBeNull();
  });

  it('exports the plan to a blob download', async () => {
    const exportFn = vi.fn(() => of(new Blob(['x'])));
    (globalThis.URL as unknown as { createObjectURL: unknown }).createObjectURL = vi.fn(
      () => 'blob:x',
    );
    (globalThis.URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = vi.fn();
    const fixture = await setup({ get: vi.fn(() => of(plan)), export: exportFn });

    fixture.componentInstance.downloadExcel();

    expect(exportFn).toHaveBeenCalledWith(2027);
  });

  it('runs the optional Excel comparison and stores the report', async () => {
    const report = {
      missingInCatalog: [{ clave: '2156099', nombre: 'X' }],
      missingInFile: [],
      nameMismatches: [],
      unknownPrograms: [],
      missingPrograms: [],
    };
    const check = vi.fn(() => of(report));
    const fixture = await setup({ get: vi.fn(() => of(plan)), check });

    fixture.componentInstance.openCheckDialog();
    fixture.componentInstance.checkFile.set(new File(['x'], 'plan.xlsx'));
    fixture.componentInstance.runCheck();

    expect(check).toHaveBeenCalled();
    expect(fixture.componentInstance.checkReport()).toEqual(report);
    expect(fixture.componentInstance.reportIsClean()).toBe(false);
  });
});
