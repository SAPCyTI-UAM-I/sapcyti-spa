import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { AuthStateService } from '../../../core/auth/auth.service';
import { RoleType } from '../../../models';
import { DASHBOARD_REPOSITORY, DashboardRepository } from '../repositories/dashboard.repository';
import { DashboardHomeComponent } from './dashboard-home.component';

describe('DashboardHomeComponent', () => {
  const dummyRepo: DashboardRepository = {
    getCoordinatorMetrics: vi.fn(() =>
      of({ totalStudents: 0, totalProfessors: 0, totalUeas: 0, activeSurvey: null }),
    ),
    getStudentDashboard: vi.fn(() =>
      of({ studentName: '', enrollmentId: '', programType: '', activeSurvey: null }),
    ),
    getProfessorDashboard: vi.fn(() => of({ professorName: '', email: '' })),
  };

  async function setup(role: RoleType = 'COORDINATOR') {
    const mockAuth = {
      currentUser$: of({ id: 1, email: 'user@uam.mx', role, graduateProgramId: 1 }),
      getCurrentUser: () => ({ id: 1, email: 'user@uam.mx', role, graduateProgramId: 1 }),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardHomeComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: MessageService, useValue: { add: vi.fn() } },
        { provide: AuthStateService, useValue: mockAuth },
        { provide: DASHBOARD_REPOSITORY, useValue: dummyRepo },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardHomeComponent);
    fixture.detectChanges();
    return { fixture };
  }

  it('renders coordinator dashboard when user has COORDINATOR role', async () => {
    const { fixture } = await setup('COORDINATOR');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-coordinator-dashboard')).toBeTruthy();
  });

  it('renders student dashboard when user has STUDENT role', async () => {
    const { fixture } = await setup('STUDENT');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-student-dashboard')).toBeTruthy();
  });

  it('renders professor dashboard when user has PROFESSOR role', async () => {
    const { fixture } = await setup('PROFESSOR');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-professor-dashboard')).toBeTruthy();
  });
});
