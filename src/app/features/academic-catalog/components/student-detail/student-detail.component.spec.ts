import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';

import { StudentDetailResponse } from '../../../../models';
import { StudentService } from '../../services/student.service';
import { StudentDetailComponent } from './student-detail.component';

const mockResponse: StudentDetailResponse = {
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
  lastDegreeObtained: 'LICENCIATURA',
  programType: 'MAESTRIA',
  admissionDate: '2025-09-01',
  admissionTerm: '25O',
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

describe('StudentDetailComponent', () => {
  async function setup(
    studentId = '1',
    throwErr = false,
    getEnrollmentHistory?: ReturnType<typeof vi.fn>,
    overrides: Partial<StudentDetailResponse> = {},
  ) {
    const getStudent = vi.fn(() =>
      throwErr
        ? throwError(() => new HttpErrorResponse({ status: 404 }))
        : of({ ...mockResponse, ...overrides }),
    );

    await TestBed.configureTestingModule({
      imports: [StudentDetailComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'studentId' ? studentId : null),
              },
            },
          },
        },
        {
          provide: StudentService,
          useValue: {
            getStudent,
            getEnrollmentHistory: getEnrollmentHistory ?? vi.fn(() => of([])),
          },
        },
        MessageService,
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(StudentDetailComponent);
    return { fixture, getStudent };
  }

  it('loads student and program details on init and displays name', async () => {
    const { fixture, getStudent } = await setup();
    fixture.detectChanges();

    expect(getStudent).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.student()).toEqual(mockResponse);

    const nameHeader = fixture.debugElement.query(By.css('[data-testid="student-name"]'));
    expect(nameHeader.nativeElement.textContent).toContain('Ana García López');
  });

  it('renders p-message when student details fail to load', async () => {
    const { fixture } = await setup('1', true);
    fixture.detectChanges();

    expect(fixture.componentInstance.error()).toBe('reference_not_found');
    const message = fixture.debugElement.query(By.css('p-message'));
    expect(message).toBeTruthy();
  });

  it('navigates to catalog list on back click', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.componentInstance.backToCatalog();
    expect(navigateSpy).toHaveBeenCalledWith('/academic-catalog/students');
  });

  it('builds correct edit path', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();

    expect(fixture.componentInstance.editRoute()).toEqual([
      '/academic-catalog/students',
      '1',
      'edit',
    ]);
  });

  it('marks invalid student id as student reference error without loading data', async () => {
    const { fixture, getStudent } = await setup('invalid-id');
    fixture.detectChanges();

    expect(getStudent).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toBe('reference_not_found');
  });
  it('shows the enrollment history, hiding letters while the plan is PENDING (HU-61)', async () => {
    const history = vi.fn(() =>
      of([
        {
          term: '26I',
          academicTermSelected: 'III',
          mode: 'ENROLL_UEAS' as const,
          planStatus: 'PENDING' as const,
          note: 'PENDING' as const,
          ueas: [
            {
              status: 'PENDING' as const,
              clave: '2156024',
              nombre: 'REDES',
              grupo: null,
              professors: [],
              schedule: null,
            },
          ],
        },
      ]),
    );
    const { fixture } = await setup('1', false, history);
    fixture.detectChanges();

    expect(history).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.history()).toHaveLength(1);
    // Sin plan TERMINADA no se pinta ninguna letra de grupo.
    expect(fixture.nativeElement.textContent).not.toContain('CO43');
  });

  it('shows every co-director in a finished enrollment-history group', async () => {
    const history = vi.fn(() =>
      of([
        {
          term: '25P',
          academicTermSelected: 'IV',
          mode: 'ENROLL_UEAS' as const,
          planStatus: 'TERMINADA' as const,
          note: null,
          ueas: [
            {
              status: 'ASSIGNED' as const,
              clave: '2156047',
              nombre: 'PROYECTO DE INVESTIGACIÓN',
              grupo: 'CR43',
              professors: [
                { professorId: 8, employeeNumber: '40008', professorName: 'Rafaela Blanco' },
                { professorId: 9, employeeNumber: '40009', professorName: 'Elena Soto' },
              ],
              schedule: null,
            },
          ],
        },
      ]),
    );
    const { fixture } = await setup('1', false, history);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Rafaela Blanco');
    expect(fixture.nativeElement.textContent).toContain('Elena Soto');
  });

  it('keeps a requested UEA that was removed from the final plan', async () => {
    const history = vi.fn(() =>
      of([
        {
          term: '25P',
          academicTermSelected: 'IV',
          mode: 'ENROLL_UEAS' as const,
          planStatus: 'TERMINADA' as const,
          note: null,
          ueas: [
            {
              status: 'REMOVED_FROM_FINAL_PLAN' as const,
              clave: '2156040',
              nombre: 'TEMAS SELECTOS',
              grupo: null,
              professors: [],
              schedule: null,
            },
          ],
        },
      ]),
    );
    const { fixture } = await setup('1', false, history);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('2156040');
    expect(fixture.nativeElement.textContent).not.toContain('CO43');
  });

  it('shows a historical student without admission term, with no error (HU-56)', async () => {
    const { fixture } = await setup('1', false, undefined, { admissionTerm: null });
    fixture.detectChanges();

    expect(fixture.componentInstance.error()).toBeNull();
    expect(fixture.componentInstance.student()?.admissionTerm).toBeNull();
  });

  it('flags a history load error without breaking the rest of the detail', async () => {
    const history = vi.fn(() => throwError(() => new HttpErrorResponse({ status: 500 })));
    const { fixture } = await setup('1', false, history);
    fixture.detectChanges();

    expect(fixture.componentInstance.historyError()).toBe(true);
    expect(fixture.componentInstance.student()).toEqual(mockResponse);
  });
});
