import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

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

describe('StudentDetailComponent', () => {
  async function setup(studentId = '1', throwErr = false) {
    const getStudent = vi.fn(() =>
      throwErr ? throwError(() => new HttpErrorResponse({ status: 404 })) : of(mockResponse),
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
        { provide: StudentService, useValue: { getStudent } },
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
});
