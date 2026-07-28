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

  it('orders display rows by clave/nombre while keeping the form in plan order', async () => {
    const two: AnnualPlanDetail = {
      year: 2027,
      status: 'BORRADOR',
      terms: ['27-I', '27-P', '27-O'],
      entries: [
        { ...planFixture().entries[0]!, id: 1, clave: '2200', nombre: 'Zeta' },
        { ...planFixture().entries[0]!, id: 2, clave: '2100', nombre: 'Alfa' },
      ],
    };
    const { fixture } = await setup(two);
    const grid = fixture.componentInstance;

    expect(grid.orderedRows().map((r) => r.entry.clave)).toEqual(['2200', '2100']);
    grid.sortBy('clave');
    expect(grid.orderedRows().map((r) => r.entry.clave)).toEqual(['2100', '2200']);
    grid.sortBy('clave');
    expect(grid.orderedRows().map((r) => r.entry.clave)).toEqual(['2200', '2100']);
    grid.sortBy('nombre');
    expect(grid.orderedRows().map((r) => r.entry.nombre)).toEqual(['Alfa', 'Zeta']);
    // Form row 0 still maps to the first plan entry (2200), independent of display order.
    expect(grid.rowGroup(0).get('gruposI')?.value).toBe('1');
  });

  it('cycles editable marks but leaves PCyTI (catalog-derived) read-only', async () => {
    const { fixture } = await setup(planFixture());
    const grid = fixture.componentInstance;
    // PCyTI's obligatoria/optativa mark comes from the catalog — clicking does nothing.
    expect(grid.markAt(0, 'PCYTI')).toBe('X');
    grid.cycle(0, 'PCYTI');
    expect(grid.markAt(0, 'PCYTI')).toBe('X');
    // Other program columns still cycle empty → X → O → empty.
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

  it('marks both cells and blocks saving when a groups/quota pair is incomplete', async () => {
    const { fixture, saveEntries } = await setup(planFixture());
    fixture.componentInstance.rowGroup(0).patchValue({ gruposP: '2', cupoP: '' });
    fixture.componentInstance.save();

    expect(saveEntries).not.toHaveBeenCalled();
    expect(fixture.componentInstance.cellInvalid(0, 'gruposP')).toBe(true);
    expect(fixture.componentInstance.cellInvalid(0, 'cupoP')).toBe(true);
  });

  it('saves valid entries and emits the updated plan', async () => {
    const plan = planFixture();
    const { fixture, saveEntries } = await setup(plan);
    let emitted: AnnualPlanDetail | undefined;
    fixture.componentInstance.saved.subscribe((detail) => (emitted = detail));

    fixture.componentInstance.save();

    // PCyTI is catalog-derived (read-only) so it's dropped from the payload; only the
    // editable cells/marks are sent.
    expect(saveEntries).toHaveBeenCalledWith(2027, {
      entries: [expect.objectContaining({ id: 1, gruposI: '1', cupoI: '15', marks: {} })],
    });
    expect(emitted).toEqual(plan);
  });
});
