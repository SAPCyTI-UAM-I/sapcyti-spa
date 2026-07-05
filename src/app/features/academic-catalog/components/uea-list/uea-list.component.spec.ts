import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';

import { PageResponse, UeaCatalogItem } from '../../../../models';
import { UeaService } from '../../services/uea.service';
import { UeaListComponent } from './uea-list.component';

const inactiveUea: UeaCatalogItem = {
  id: 38,
  clave: '2159018',
  nombre: 'SEMINARIO DE INVESTIGACIÓN DOCTORAL III',
  tipo: 'OBLIGATORIA',
  modalidad: 'MIXTA',
  horasTeoria: 3,
  horasPractica: 0,
  tipoFormacion: 'INVESTIGACION',
  creditos: 6,
  active: false,
};

function ueaPage(content: UeaCatalogItem[]): PageResponse<UeaCatalogItem> {
  return { content, totalElements: content.length, totalPages: 1, size: 8, number: 0 };
}

describe('UeaListComponent restore (HU-55)', () => {
  async function setup(restoreUea = vi.fn(() => of({ ...inactiveUea, active: true }))) {
    const listUeas = vi.fn(() => of(ueaPage([inactiveUea])));
    await TestBed.configureTestingModule({
      imports: [UeaListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: UeaService, useValue: { listUeas, restoreUea } },
        MessageService,
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(UeaListComponent);
    fixture.detectChanges();
    return { fixture, listUeas, restoreUea };
  }

  it('restores an inactive UEA and reloads the list', async () => {
    const { fixture, listUeas, restoreUea } = await setup();

    fixture.componentInstance.askRestore(inactiveUea);
    expect(fixture.componentInstance.restoreTarget()).toEqual(inactiveUea);

    fixture.componentInstance.confirmRestore();

    expect(restoreUea).toHaveBeenCalledWith(38);
    expect(fixture.componentInstance.restoreTarget()).toBeNull();
    expect(listUeas).toHaveBeenCalledTimes(2); // initial load + reload
  });

  it('surfaces UEA_ALREADY_ACTIVE inline', async () => {
    const restoreUea = vi.fn(() =>
      throwError(
        () => new HttpErrorResponse({ status: 409, error: { error: 'UEA_ALREADY_ACTIVE' } }),
      ),
    );
    const { fixture } = await setup(restoreUea);

    fixture.componentInstance.askRestore(inactiveUea);
    fixture.componentInstance.confirmRestore();

    expect(fixture.componentInstance.restoreError()).toBe('uea_already_active');
    expect(fixture.componentInstance.restoreTarget()).toEqual(inactiveUea);
  });
});
