import { TestBed } from '@angular/core/testing';
import { FormGroupDirective } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { PageResponse, ProfessorCatalogItem } from '../../../../models';
import { ProfessorService } from '../../services/professor.service';
import { ProfessorListComponent } from './professor-list.component';

const sampleProfessor: ProfessorCatalogItem = {
  id: 2,
  userId: 202,
  professorType: 'INTERNO',
  active: true,
  employeeNumber: '40001',
  email: 'laura@uam.mx',
  graduateProgramId: 1,
  firstName: 'Laura',
  firstLastName: 'Martínez',
  phone: '5544455566',
  commissionMember: false,
};

function buildProfessorPage(
  content: ProfessorCatalogItem[] = [sampleProfessor],
): PageResponse<ProfessorCatalogItem> {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: 10,
    number: 0,
  };
}

describe('ProfessorListComponent', () => {
  async function setup() {
    const listProfessors = vi.fn(() => of(buildProfessorPage()));
    await TestBed.configureTestingModule({
      imports: [ProfessorListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ProfessorService, useValue: { listProfessors } },
        MessageService,
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProfessorListComponent);
    return { fixture, listProfessors };
  }

  function patchFilters(
    fixture: ReturnType<typeof TestBed.createComponent<ProfessorListComponent>>,
    values: { search?: string; active?: string },
  ): void {
    const form = fixture.debugElement
      .query(By.directive(FormGroupDirective))
      .injector.get(FormGroupDirective);
    form.form.patchValue(values);
  }

  it('calls listProfessors on init with page 0, size 10 and active-only default', async () => {
    const { fixture, listProfessors } = await setup();
    fixture.detectChanges();

    expect(listProfessors).toHaveBeenCalledTimes(1);
    expect(listProfessors).toHaveBeenCalledWith({
      page: 0,
      size: 10,
      search: undefined,
      active: true,
    });
  });

  it('maps filters through parseActiveFilter and trims search', async () => {
    const { fixture, listProfessors } = await setup();
    fixture.detectChanges();
    listProfessors.mockClear();

    patchFilters(fixture, { search: '  laura  ', active: 'true' });
    fixture.componentInstance.applyFilters();

    expect(listProfessors).toHaveBeenCalledWith({
      page: 0,
      size: 10,
      search: 'laura',
      active: true,
    });
  });

  it('maps empty filter values to undefined', async () => {
    const { fixture, listProfessors } = await setup();
    fixture.detectChanges();
    listProfessors.mockClear();

    patchFilters(fixture, { search: '   ', active: '' });
    fixture.componentInstance.applyFilters();

    expect(listProfessors).toHaveBeenCalledWith({
      page: 0,
      size: 10,
      search: undefined,
      active: undefined,
    });
  });
});
