import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { PageResponse, StudentProgramResponse } from '../../../../models';
import { ProfessorService } from '../../services/professor.service';
import { StudentProgramService } from '../../services/student-program.service';
import { StudentProgramEditComponent } from './student-program-edit.component';

const sampleProgram: StudentProgramResponse = {
  id: 100,
  studentId: 1,
  graduateProgramId: 1,
  enrollmentId: '223300456',
  programType: 'MAESTRIA',
  admissionDate: '2025-09-01',
  status: 'ACTIVO',
  advisorIds: [],
  advisors: [],
};

const emptyProfessorPage: PageResponse<never> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 100,
  number: 0,
};

describe('StudentProgramEditComponent', () => {
  async function setup() {
    const getProgram = vi.fn(() => of(sampleProgram));
    const updateProgram = vi.fn(() => of({ ...sampleProgram, tutorId: 10 }));
    const listProfessors = vi.fn(() => of(emptyProfessorPage));

    await TestBed.configureTestingModule({
      imports: [StudentProgramEditComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        MessageService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) =>
                  key === 'studentId' ? '1' : key === 'programId' ? '100' : null,
              },
            },
          },
        },
        {
          provide: StudentProgramService,
          useValue: { getProgram, updateProgram },
        },
        { provide: ProfessorService, useValue: { listProfessors } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(StudentProgramEditComponent);
    return { fixture, getProgram, updateProgram, listProfessors };
  }

  it('loads program and professors on init', async () => {
    const { fixture, getProgram, listProfessors } = await setup();
    fixture.detectChanges();

    expect(getProgram).toHaveBeenCalled();
    expect(listProfessors).toHaveBeenCalledWith({ page: 0, size: 100, active: true });
    expect(fixture.componentInstance.program()?.id).toBe(100);
  });

  it('requires withdrawal reason when status is BAJA', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ status: 'BAJA', withdrawalReason: '' });
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('submits update and navigates to view', async () => {
    const { fixture, updateProgram } = await setup();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ tutorId: 10 });
    fixture.componentInstance.submit();

    expect(updateProgram).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith([
      '/academic-catalog/students',
      fixture.componentInstance.studentId,
      'programs',
      fixture.componentInstance.programId,
    ]);
  });
});
