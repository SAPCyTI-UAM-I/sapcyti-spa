import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PageResponse, ProfessorCatalogItem, StudentCatalogItem } from '../../../models';
import { PlanPickersController } from './plan-pickers.controller';
import { TrimestralPlanService } from './trimestral-plan.service';

function page<T>(content: T[]): PageResponse<T> {
  return { content, totalElements: content.length, totalPages: 1, size: 30, number: 0 };
}

const PROFESSOR = {
  id: 8,
  userId: 108,
  professorType: 'INTERNO',
  active: true,
  employeeNumber: '40008',
  email: 'rafa@uam.mx',
  graduateProgramId: 1,
  firstName: 'Rafaela',
  firstLastName: 'Blanco',
  phone: '5500000000',
  commissionMember: false,
} as ProfessorCatalogItem;

const STUDENT = {
  id: 1,
  enrollmentId: '2231800001',
  firstName: 'Ana',
  firstLastName: 'Reyes',
} as StudentCatalogItem;

describe('PlanPickersController', () => {
  function setup() {
    const searchProfessors = vi.fn(() => of(page([PROFESSOR])));
    const searchStudents = vi.fn(() => of(page([STUDENT])));
    const searchUeas = vi.fn(() => of(page([])));

    TestBed.configureTestingModule({
      providers: [
        PlanPickersController,
        {
          provide: TrimestralPlanService,
          useValue: { searchProfessors, searchStudents, searchUeas },
        },
      ],
    });

    return {
      controller: TestBed.inject(PlanPickersController),
      searchProfessors,
      searchStudents,
      searchUeas,
    };
  }

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('debounces each picker on its own: filtering students does not cancel the professor search', () => {
    const { controller, searchProfessors, searchStudents } = setup();

    controller.onProfessorFilter('blanco');
    vi.advanceTimersByTime(100);
    controller.onStudentFilter('ana');
    vi.advanceTimersByTime(300);

    expect(searchProfessors).toHaveBeenCalledWith('blanco');
    expect(searchStudents).toHaveBeenCalledWith('ana');
  });

  it('keeps one spinner per picker so the fastest search does not switch off the others', () => {
    const { controller } = setup();

    controller.loadProfessors('');

    expect(controller.professorsLoading()).toBe(false);
    expect(controller.studentsLoading()).toBe(false);
  });

  it('drops the pending debounce when the view is destroyed', () => {
    const { controller, searchProfessors } = setup();

    controller.onProfessorFilter('blanco');
    TestBed.resetTestingModule();
    vi.advanceTimersByTime(300);

    expect(searchProfessors).not.toHaveBeenCalled();
  });

  it('pins already assigned students so a filtered-out member stays selected', () => {
    const { controller } = setup();

    controller.loadStudents('ana');
    controller.pinStudents([
      {
        studentId: 99,
        enrollmentId: '2231800099',
        fullName: 'Zoe Vega',
        source: 'MANUAL',
        academicTerm: null,
        obs: null,
      },
    ]);

    expect(controller.students().map((option) => option.value)).toEqual([1, 99]);
  });
});
