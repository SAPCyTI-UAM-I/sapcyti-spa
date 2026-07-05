import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';

import { UeaCatalogItem } from '../../../../models';
import { UeaService } from '../../services/uea.service';
import { UeaEditComponent } from './uea-edit.component';

const uea: UeaCatalogItem = {
  id: 5,
  clave: '2156038',
  nombre: 'Algoritmos distribuidos',
  tipo: 'OPTATIVA',
  modalidad: 'MIXTA',
  horasTeoria: 4.5,
  horasPractica: 0,
  tipoFormacion: 'COMPLEMENTARIA',
  creditos: 9,
  active: true,
};

function conflict(code: string): HttpErrorResponse {
  return new HttpErrorResponse({ status: 409, error: { error: code } });
}

describe('UeaEditComponent', () => {
  async function setup(service: Partial<UeaService>) {
    await TestBed.configureTestingModule({
      imports: [UeaEditComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: UeaService, useValue: service },
        MessageService,
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '5' } } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(UeaEditComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('loads the UEA, prefills the form and keeps clave read-only', async () => {
    const fixture = await setup({ getUea: vi.fn(() => of(uea)) });
    const form = fixture.componentInstance.form;

    expect(fixture.componentInstance.uea()).toEqual(uea);
    expect(form.get('nombre')?.value).toBe('Algoritmos distribuidos');
    expect(form.get('clave')?.disabled).toBe(true);
  });

  it('updates without clave and navigates back to the list', async () => {
    const updateUea = vi.fn(() => of(uea));
    const fixture = await setup({ getUea: vi.fn(() => of(uea)), updateUea });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.componentInstance.submit();

    expect(updateUea).toHaveBeenCalledWith(
      5,
      expect.not.objectContaining({ clave: expect.anything() }),
    );
    expect(navigate).toHaveBeenCalledWith(['/academic-catalog/ueas']);
  });

  it('deactivates and navigates back to the list', async () => {
    const deactivateUea = vi.fn(() => of({ ...uea, active: false }));
    const fixture = await setup({ getUea: vi.fn(() => of(uea)), deactivateUea });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.componentInstance.openDeactivateDialog();
    fixture.componentInstance.confirmDeactivate();

    expect(deactivateUea).toHaveBeenCalledWith(5);
    expect(navigate).toHaveBeenCalledWith(['/academic-catalog/ueas']);
  });

  it('surfaces UEA_ALREADY_INACTIVE inline on deactivate', async () => {
    const deactivateUea = vi.fn(() => throwError(() => conflict('UEA_ALREADY_INACTIVE')));
    const fixture = await setup({ getUea: vi.fn(() => of(uea)), deactivateUea });

    fixture.componentInstance.confirmDeactivate();

    expect(fixture.componentInstance.deactivateError()).toBe('uea_already_inactive');
  });
});
