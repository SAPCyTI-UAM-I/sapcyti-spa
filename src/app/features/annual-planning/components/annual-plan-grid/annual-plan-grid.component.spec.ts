import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { AnnualPlanDetail } from '../../../../models';
import { AnnualPlanService } from '../../services/annual-plan.service';
import { AnnualPlanGridComponent } from './annual-plan-grid.component';

function planFixture(status: AnnualPlanDetail['status'] = 'BORRADOR'): AnnualPlanDetail {
  return {
    year: 2027,
    status,
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
}

describe('AnnualPlanGridComponent', () => {
  async function setup(plan: AnnualPlanDetail, saveEntries = vi.fn(() => of(plan))) {
    await TestBed.configureTestingModule({
      imports: [AnnualPlanGridComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [{ provide: AnnualPlanService, useValue: { saveEntries } }, MessageService],
    }).compileComponents();
    const fixture = TestBed.createComponent(AnnualPlanGridComponent);
    fixture.componentRef.setInput('plan', plan);
    fixture.detectChanges();
    return { fixture, saveEntries };
  }

  it('builds one editable row per entry when BORRADOR', async () => {
    const { fixture } = await setup(planFixture());
    expect(fixture.componentInstance.rows.length).toBe(1);
    expect(fixture.componentInstance.editable()).toBe(true);
    expect(fixture.componentInstance.rowGroup(0).get('gruposI')?.value).toBe('1');
  });

  it('is read-only when TERMINADA', async () => {
    const { fixture } = await setup(planFixture('TERMINADA'));
    expect(fixture.componentInstance.editable()).toBe(false);
  });

  it('cycles a program mark on interaction', async () => {
    const { fixture } = await setup(planFixture());
    const grid = fixture.componentInstance;
    expect(grid.markAt(0, 'PCYTI')).toBe('X');
    grid.cycle(0, 'PCYTI');
    expect(grid.markAt(0, 'PCYTI')).toBe('O');
    grid.cycle(0, 'P_MAT');
    expect(grid.markAt(0, 'P_MAT')).toBe('X');
  });

  it('blocks saving when a cell is invalid', async () => {
    const { fixture, saveEntries } = await setup(planFixture());
    fixture.componentInstance.rowGroup(0).get('gruposI')?.setValue('-1');
    fixture.componentInstance.save();

    expect(saveEntries).not.toHaveBeenCalled();
    expect(fixture.componentInstance.showInvalidMessage()).toBe(true);
  });

  it('saves valid entries and emits the updated plan', async () => {
    const plan = planFixture();
    const { fixture, saveEntries } = await setup(plan);
    let emitted: AnnualPlanDetail | undefined;
    fixture.componentInstance.saved.subscribe((detail) => (emitted = detail));

    fixture.componentInstance.save();

    expect(saveEntries).toHaveBeenCalledWith(2027, {
      entries: [
        expect.objectContaining({ id: 1, gruposI: '1', cupoI: '15', marks: { PCYTI: 'X' } }),
      ],
    });
    expect(emitted).toEqual(plan);
  });
});
