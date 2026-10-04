import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';

import { EnrollmentHistoryEntry, StudentDetailResponse } from '../../../models';
import { StudentProfileService } from '../services/student-profile.service';
import { StudentProfileComponent } from './student-profile.component';

const mockStudent: StudentDetailResponse = {
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
    status: 'EN_INVESTIGACION',
    advisorIds: [],
    advisors: [],
  },
};

const mockHistory: EnrollmentHistoryEntry[] = [
  {
    term: '24-O',
    academicTermSelected: 'I',
    mode: 'ENROLL_UEAS',
    planStatus: 'TERMINADA',
    note: null,
    ueas: [],
  },
];

describe('StudentProfileComponent', () => {
  async function setup(profileError = false, historyError = false) {
    const service = {
      getMyProfile: vi.fn(() =>
        profileError ? throwError(() => new Error('Failed to load profile')) : of(mockStudent),
      ),
      getMyEnrollmentHistory: vi.fn(() =>
        historyError ? throwError(() => new Error('Failed to load history')) : of(mockHistory),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [StudentProfileComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: StudentProfileService, useValue: service },
        { provide: MessageService, useValue: { add: vi.fn() } },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const routerNavigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const fixture = TestBed.createComponent(StudentProfileComponent);
    fixture.detectChanges();

    return { fixture, routerNavigateByUrl, service };
  }

  it('loads and renders student profile and enrollment history', async () => {
    const { fixture } = await setup();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Ana García López');
    expect(text).toContain('223300456');
    expect(text).toContain('24-O');
  });

  it('renders error message when profile loading fails', async () => {
    const { fixture } = await setup(true);
    expect(fixture.componentInstance.error()).toBe(true);
    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('Ana García López');
  });

  it('navigates to dashboard on back click', async () => {
    const { fixture, routerNavigateByUrl } = await setup();
    fixture.componentInstance.backToDashboard();
    expect(routerNavigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
});
