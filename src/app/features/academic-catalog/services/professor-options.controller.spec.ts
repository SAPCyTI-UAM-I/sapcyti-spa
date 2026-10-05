import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PageResponse, ProfessorCatalogItem, StudentProgramResponse } from '../../../models';
import { ProfessorService } from './professor.service';
import { ProfessorOptionsController } from './professor-options.controller';

function prof(id: number, firstName: string, firstLastName: string): ProfessorCatalogItem {
  return {
    id,
    userId: 100 + id,
    professorType: 'INTERNO',
    active: true,
    employeeNumber: String(id),
    email: `${firstName}@uam.mx`,
    graduateProgramId: 1,
    firstName,
    firstLastName,
    phone: '5500000000',
    commissionMember: false,
  };
}

function page(content: ProfessorCatalogItem[]): PageResponse<ProfessorCatalogItem> {
  return { content, totalElements: content.length, totalPages: 1, size: 30, number: 0 };
}

describe('ProfessorOptionsController', () => {
  function setup(
    listProfessors = vi.fn(() => of(page([prof(2, 'Beto', 'Zavala'), prof(1, 'Ana', 'Alba')]))),
  ) {
    TestBed.configureTestingModule({
      providers: [
        ProfessorOptionsController,
        { provide: ProfessorService, useValue: { listProfessors } },
      ],
    });
    return { controller: TestBed.inject(ProfessorOptionsController), listProfessors };
  }

  it('loads active professors and sorts them by label', () => {
    const { controller, listProfessors } = setup();
    controller.load();

    expect(listProfessors).toHaveBeenCalledWith({
      page: 0,
      size: 30,
      active: true,
      search: undefined,
    });
    // "Alba Ana" sorts before "Zavala Beto"
    expect(controller.options().map((o) => o.value)).toEqual([1, 2]);
  });

  it('keeps pinned tutor/advisors listed after a filter that excludes them', () => {
    const { controller } = setup(vi.fn(() => of(page([prof(5, 'Carlos', 'Cruz')]))));
    const program = {
      tutorId: 9,
      tutor: { id: 9, firstName: 'Tere', firstLastName: 'Tovar' },
      advisors: [{ id: 8, firstName: 'Aldo', firstLastName: 'Ávila' }],
    } as StudentProgramResponse;

    controller.pinFromProgram(program);
    controller.load();

    const ids = controller.options().map((o) => o.value);
    expect(ids).toEqual(expect.arrayContaining([8, 9, 5])); // pinned kept + loaded added
  });

  it('resolves a label by id (empty for null/unknown)', () => {
    const { controller } = setup();
    controller.load();

    expect(controller.labelFor(1)).toBe('Alba Ana');
    expect(controller.labelFor(null)).toBe('');
    expect(controller.labelFor(999)).toBe('');
  });

  it('debounces the filter before loading', () => {
    vi.useFakeTimers();
    const { controller, listProfessors } = setup();

    controller.onFilter('alb');
    controller.onFilter('alba');
    expect(listProfessors).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(listProfessors).toHaveBeenCalledTimes(1);
    expect(listProfessors).toHaveBeenCalledWith({
      page: 0,
      size: 30,
      active: true,
      search: 'alba',
    });
    vi.useRealTimers();
  });
});
