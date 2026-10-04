import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import {
  CoordinatorDashboardMetrics,
  ProfessorDashboardData,
  StudentDashboardData,
} from '../../models/dashboard.model';
import { DASHBOARD_REPOSITORY } from '../../repositories/dashboard.repository';
import { StudentDashboardComponent } from './student-dashboard.component';

describe('StudentDashboardComponent', () => {
  const mockStudentData: StudentDashboardData = {
    studentName: 'Ana Valeria Silva',
    enrollmentId: '223300999',
    programType: 'Maestría en CyTI',
    activeSurvey: {
      id: 2,
      term: '26-P',
      opensAt: '2026-03-01T08:00:00Z',
      closesAt: '2026-03-15T23:59:59Z',
      hasResponded: false,
    },
  };

  async function setup(studentData = mockStudentData) {
    const mockRepo = {
      getCoordinatorMetrics: vi.fn(() =>
        of({
          totalStudents: 0,
          totalProfessors: 0,
          totalUeas: 0,
          activeSurvey: null,
        } satisfies CoordinatorDashboardMetrics),
      ),
      getStudentDashboard: vi.fn(() => of(studentData)),
      getProfessorDashboard: vi.fn(() =>
        of({ professorName: '', email: '' } satisfies ProfessorDashboardData),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [StudentDashboardComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: DASHBOARD_REPOSITORY, useValue: mockRepo }],
    }).compileComponents();

    const fixture = TestBed.createComponent(StudentDashboardComponent);
    fixture.detectChanges();
    return { fixture, mockRepo };
  }

  it('renders student identity information correctly', async () => {
    const { fixture, mockRepo } = await setup();
    expect(mockRepo.getStudentDashboard).toHaveBeenCalled();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Ana Valeria Silva');
    expect(compiled.textContent).toContain('223300999');
    expect(compiled.textContent).toContain('Maestría en CyTI');
  });

  it('displays survey action button when student has not responded yet', async () => {
    const { fixture } = await setup();
    const compiled = fixture.nativeElement as HTMLElement;

    const actionLink = compiled.querySelector('a[href="/enrollment-survey/respond"]');
    expect(actionLink).toBeTruthy();
  });
});
