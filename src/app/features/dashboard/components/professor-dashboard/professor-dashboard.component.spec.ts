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
import { ProfessorDashboardComponent } from './professor-dashboard.component';

describe('ProfessorDashboardComponent', () => {
  const mockProfessorData: ProfessorDashboardData = {
    professorName: 'Dr. Alejandro Morales',
    email: 'prof.pcd@posgrado.uam.mx',
  };

  async function setup() {
    const mockRepo = {
      getCoordinatorMetrics: vi.fn(() =>
        of({
          totalStudents: 0,
          totalProfessors: 0,
          totalUeas: 0,
          activeSurvey: null,
        } satisfies CoordinatorDashboardMetrics),
      ),
      getStudentDashboard: vi.fn(() =>
        of({
          studentName: '',
          enrollmentId: '',
          programType: '',
          activeSurvey: null,
        } satisfies StudentDashboardData),
      ),
      getProfessorDashboard: vi.fn(() => of(mockProfessorData)),
    };

    await TestBed.configureTestingModule({
      imports: [ProfessorDashboardComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: DASHBOARD_REPOSITORY, useValue: mockRepo }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProfessorDashboardComponent);
    fixture.detectChanges();
    return { fixture, mockRepo };
  }

  it('renders professor name and email', async () => {
    const { fixture, mockRepo } = await setup();
    expect(mockRepo.getProfessorDashboard).toHaveBeenCalled();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Dr. Alejandro Morales');
    expect(compiled.textContent).toContain('prof.pcd@posgrado.uam.mx');
  });

  it('provides account security link to password change', async () => {
    const { fixture } = await setup();
    const compiled = fixture.nativeElement as HTMLElement;

    const securityLink = compiled.querySelector('a[href="/account/password"]');
    expect(securityLink).toBeTruthy();
  });
});
