import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { StudentProgramResponse } from '../../../../models';
import { StudentProgramService } from '../../services/student-program.service';
import { StudentProgramViewComponent } from './student-program-view.component';

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

describe('StudentProgramViewComponent', () => {
  async function setup(program = sampleProgram) {
    const getProgram = vi.fn(() => of(program));
    await TestBed.configureTestingModule({
      imports: [StudentProgramViewComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
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
        { provide: StudentProgramService, useValue: { getProgram } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(StudentProgramViewComponent);
    return { fixture, getProgram };
  }

  it('loads program on init', async () => {
    const { fixture, getProgram } = await setup();
    fixture.detectChanges();

    expect(getProgram).toHaveBeenCalledWith(1, 100);
    expect(fixture.componentInstance.program()?.enrollmentId).toBe('223300456');
  });

  it('shows empty tutor state when tutor is missing', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('ACADEMIC_CATALOG.STUDENT_PROGRAM.VIEW.NO_TUTOR');
  });

  it('maps load errors', async () => {
    const getProgram = vi.fn(() =>
      throwError(() => ({
        status: 404,
        error: { error: 'NOT_FOUND', message: 'Student program not found' },
      })),
    );
    await TestBed.configureTestingModule({
      imports: [StudentProgramViewComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
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
        { provide: StudentProgramService, useValue: { getProgram } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(StudentProgramViewComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.error()).toBe('program_not_found');
  });
});
