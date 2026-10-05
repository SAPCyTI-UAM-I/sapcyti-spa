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
import { CoordinatorDashboardComponent } from './coordinator-dashboard.component';

describe('CoordinatorDashboardComponent', () => {
  const mockMetrics: CoordinatorDashboardMetrics = {
    totalStudents: 42,
    totalProfessors: 15,
    totalUeas: 28,
    activeSurvey: {
      id: 1,
      term: '26-I',
      opensAt: '2026-01-10T08:00:00Z',
      closesAt: '2026-01-25T23:59:59Z',
      status: 'ACTIVE',
      totalResponses: 18,
    },
    latestAnnualPlanYear: 2026,
  };

  async function setup() {
    const mockRepo = {
      getCoordinatorMetrics: vi.fn(() => of(mockMetrics)),
      getStudentDashboard: vi.fn(() =>
        of({
          studentName: '',
          enrollmentId: '',
          programType: '',
          activeSurvey: null,
        } satisfies StudentDashboardData),
      ),
      getProfessorDashboard: vi.fn(() =>
        of({ professorName: '', email: '' } satisfies ProfessorDashboardData),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [CoordinatorDashboardComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: DASHBOARD_REPOSITORY, useValue: mockRepo }],
    }).compileComponents();

    const fixture = TestBed.createComponent(CoordinatorDashboardComponent);
    fixture.detectChanges();
    return { fixture, mockRepo };
  }

  it('loads and displays coordinator metrics on initialization', async () => {
    const { fixture, mockRepo } = await setup();
    expect(mockRepo.getCoordinatorMetrics).toHaveBeenCalled();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('42');
    expect(compiled.textContent).toContain('15');
    expect(compiled.textContent).toContain('28');
  });

  it('renders active survey details when survey is active', async () => {
    const { fixture } = await setup();
    const compiled = fixture.nativeElement as HTMLElement;

    const surveyLink = compiled.querySelector('a[href="/enrollment-survey"]');
    expect(surveyLink).toBeTruthy();
    expect(compiled.textContent).toContain('DASHBOARD.COORDINATOR.SURVEY_TITLE');
  });
});
