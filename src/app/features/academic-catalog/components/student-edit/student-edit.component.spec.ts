import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';

import { PageResponse, StudentDetailResponse, RESEARCH_CATALOG } from '../../../../models';
import { BACKEND_MESSAGES } from '../../../../core/errors/constants/backend-messages';
import { mockApiError } from '../../../../core/errors/testing/mock-api-error.util';
import { StudentService } from '../../services/student.service';
import { StudentProgramService } from '../../services/student-program.service';
import { ProfessorService } from '../../services/professor.service';
import { ResearchCatalogService } from '../../services/research-catalog.service';
import { StudentEditComponent } from './student-edit.component';

const sampleStudentDetail: StudentDetailResponse = {
  id: 1,
  userId: 101,
  enrollmentId: '223300456',
  email: 'ana.garcia@uam.mx',
  graduateProgramId: 1,
  firstName: 'Ana',
  firstLastName: 'García',
  secondLastName: 'López',
  nationality: 'Mexicana',
  birthDate: '1998-04-12',
  phone: '5512345678',
  phoneExtension: '101',
  undergraduateDegree: 'Computación',
  lastDegreeObtained: 'Licenciatura en Computación',
  programType: 'MAESTRIA',
  admissionDate: '2025-09-01',
  active: true,
  program: {
    id: 100,
    studentId: 1,
    graduateProgramId: 1,
    enrollmentId: '223300456',
    programType: 'MAESTRIA',
    admissionDate: '2025-09-01',
    status: 'ACTIVO',
    advisorIds: [],
    advisors: [],
  },
};

const emptyProfessorPage: PageResponse<never> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 30,
  number: 0,
};

describe('StudentEditComponent', () => {
  async function setup(
    options: {
      submitError?: 'duplicate_email' | null;
      updateProgramError?: 'program_not_found' | 'professor_not_found' | null;
    } = {},
  ) {
    const getStudent = vi.fn(() => of(sampleStudentDetail));
    const updateStudent = vi.fn(() =>
      options.submitError === 'duplicate_email'
        ? throwError(() =>
            mockApiError({
              status: 409,
              error: 'CONFLICT',
              message: BACKEND_MESSAGES.ACADEMIC.DUPLICATE_STUDENT_EMAIL,
            }),
          )
        : of({ ...sampleStudentDetail, firstName: 'Ana Editada' }),
    );
    const updateProgram = vi.fn(() => {
      if (options.updateProgramError === 'program_not_found') {
        return throwError(() =>
          mockApiError({
            status: 404,
            error: 'NOT_FOUND',
            message: BACKEND_MESSAGES.ACADEMIC.STUDENT_PROGRAM_NOT_FOUND,
          }),
        );
      }

      if (options.updateProgramError === 'professor_not_found') {
        return throwError(() =>
          mockApiError({
            status: 404,
            error: 'NOT_FOUND',
            message: BACKEND_MESSAGES.ACADEMIC.PROFESSOR_NOT_FOUND,
          }),
        );
      }

      return of(sampleStudentDetail.program);
    });
    const listProfessors = vi.fn(() => of(emptyProfessorPage));

    const messageService = {
      add: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [StudentEditComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: MessageService, useValue: messageService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'studentId' ? '1' : null),
              },
            },
          },
        },
        { provide: StudentService, useValue: { getStudent, updateStudent } },
        { provide: StudentProgramService, useValue: { updateProgram } },
        { provide: ProfessorService, useValue: { listProfessors } },
        {
          provide: ResearchCatalogService,
          useValue: { getResearchCatalog: () => of([...RESEARCH_CATALOG]) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(StudentEditComponent);
    return { fixture, getStudent, updateStudent, updateProgram, listProfessors, messageService };
  }

  it('loads student and program details and list of professors on init', async () => {
    const { fixture, getStudent, listProfessors } = await setup();
    fixture.detectChanges();

    expect(getStudent).toHaveBeenCalledWith(1);
    expect(listProfessors).toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.firstName.value).toBe('Ana');
    expect(fixture.componentInstance.form.controls.status.value).toBe('ACTIVO');
  });

  it('validates the form: firstName is required', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ firstName: '' });
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.form.invalid).toBe(true);
    expect(fixture.componentInstance.displayError()).toBe('validation');
  });

  it('submits update to student and program and redirects on success', async () => {
    const { fixture, updateStudent, updateProgram, messageService } = await setup();
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.form.patchValue({ firstName: 'Ana Editada' });
    fixture.componentInstance.submit();

    expect(updateStudent).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ firstName: 'Ana Editada' }),
    );
    expect(updateProgram).toHaveBeenCalledWith(1, 100, expect.any(Object));
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success' }),
    );
    expect(navigateSpy).toHaveBeenCalledWith(['/academic-catalog/students', 1]);
  });

  it('handles email conflict validation error from backend', async () => {
    const { fixture } = await setup({ submitError: 'duplicate_email' });
    fixture.detectChanges();

    fixture.componentInstance.submit();
    expect(fixture.componentInstance.error()).toBe('duplicate_email');
  });

  it('shows date_order when graduation date is before admission date', async () => {
    const { fixture, updateStudent, updateProgram } = await setup();
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      admissionDate: '2025-09-01',
      graduationDate: '2025-08-31',
    });
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.displayError()).toBe('date_order');
    expect(updateStudent).not.toHaveBeenCalled();
    expect(updateProgram).not.toHaveBeenCalled();
  });

  it('requires withdrawalReason when status is BAJA', async () => {
    const { fixture, updateStudent, updateProgram } = await setup();
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      status: 'BAJA',
      withdrawalReason: '   ',
    });
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.displayError()).toBe('withdrawal_reason_required');
    expect(updateStudent).not.toHaveBeenCalled();
    expect(updateProgram).not.toHaveBeenCalled();
  });

  it('rejects duplicate advisor ids before submit', async () => {
    const { fixture, updateStudent, updateProgram } = await setup();
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      advisorIds: [11, 11],
    });
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.displayError()).toBe('duplicate_advisor_ids');
    expect(updateStudent).not.toHaveBeenCalled();
    expect(updateProgram).not.toHaveBeenCalled();
  });

  it('maps program_not_found when updateProgram returns a missing program error', async () => {
    const { fixture } = await setup({ updateProgramError: 'program_not_found' });
    fixture.detectChanges();

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.error()).toBe('program_not_found');
  });

  it('maps professor_not_found when updateProgram returns a missing professor error', async () => {
    const { fixture } = await setup({ updateProgramError: 'professor_not_found' });
    fixture.detectChanges();

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.error()).toBe('professor_not_found');
  });

  it('resets researchArea and updates filtered list when lineOfKnowledge changes', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      lineOfKnowledge: 'Redes de Comunicaciones',
      researchArea: 'Comunicaciones inalámbricas',
    });
    fixture.componentInstance.form.controls.lineOfKnowledge.setValue(
      'Ciencias e Ingeniería de la Computación',
    );

    expect(fixture.componentInstance.form.controls.researchArea.value).toBe('');
    expect(fixture.componentInstance.filteredResearchAreas()).toContainEqual({
      value: 'Inteligencia artificial',
      labelKey: 'ACADEMIC_CATALOG.STUDENT_PROGRAM.CATALOG.AREAS.AI',
    });
  });
});
