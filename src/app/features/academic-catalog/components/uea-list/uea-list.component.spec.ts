import { TestBed } from '@angular/core/testing';
import { FormGroupDirective } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { PageResponse, UeaCatalogItem } from '../../../../models';
import { UeaService } from '../../services/uea.service';
import { UeaListComponent } from './uea-list.component';

const uea: UeaCatalogItem = {
  id: 1,
  clave: '2156024',
  nombre: 'REDES Y PROTOCOLOS DE COMUNICACIONES',
  tipo: 'OBLIGATORIA',
  modalidad: 'MIXTA',
  horasTeoria: 3,
  horasPractica: 0,
  tipoFormacion: 'BASICA',
  creditos: 6,
  active: true,
};

function ueaPage(content: UeaCatalogItem[]): PageResponse<UeaCatalogItem> {
  return { content, totalElements: content.length, totalPages: 1, size: 8, number: 0 };
}

describe('UeaListComponent', () => {
  async function setup(listUeas = vi.fn(() => of(ueaPage([uea])))) {
    await TestBed.configureTestingModule({
      imports: [UeaListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: UeaService, useValue: { listUeas } },
        MessageService,
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(UeaListComponent);
    return { fixture, listUeas };
  }

  function patchFilters(
    fixture: ReturnType<typeof TestBed.createComponent<UeaListComponent>>,
    values: { search?: string; active?: string },
  ): void {
    fixture.debugElement
      .query(By.directive(FormGroupDirective))
      .injector.get(FormGroupDirective)
      .form.patchValue(values);
  }

  it('loads UEAs on init with page 0, size 8 and no sort by default', async () => {
    const { fixture, listUeas } = await setup();
    fixture.detectChanges();

    expect(listUeas).toHaveBeenCalledWith({
      page: 0,
      size: 8,
      search: undefined,
      active: undefined,
      sort: undefined,
    });
  });

  it('reloads with a debounced live search as the user types', async () => {
    const { fixture, listUeas } = await setup();
    fixture.detectChanges();
    vi.useFakeTimers();
    listUeas.mockClear();

    patchFilters(fixture, { search: '  redes  ' });
    vi.advanceTimersByTime(300);

    expect(listUeas).toHaveBeenCalledWith(expect.objectContaining({ page: 0, search: 'redes' }));
    vi.useRealTimers();
  });
});
