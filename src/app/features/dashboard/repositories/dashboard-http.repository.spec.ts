import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { AuthStateService } from '../../../core/auth/auth.service';
import { StudentSurveyForm } from '../../../models';
import { DashboardHttpRepository } from './dashboard-http.repository';

const activeForm: StudentSurveyForm = {
  survey: {
    id: 7,
    term: '26O',
    status: 'ACTIVO',
    opensAt: '2026-01-10T08:00:00Z',
    closesAt: '2026-01-25T23:59:59Z',
    introMessage: null,
    responseCount: 3,
    suggestedTerm: null,
  },
  student: {
    fullName: 'Ana Valeria Silva',
    enrollmentId: '223300999',
    programType: 'MAESTRIA',
  },
  availableUeas: [],
  removedUeaClaves: [],
  myResponse: {
    academicTerm: 'I',
    mode: 'ENROLL_UEAS',
    ueaIds: [1, 2],
    totalUeas: 2,
    submittedAt: '2026-01-12T00:00:00Z',
  },
};

describe('DashboardHttpRepository', () => {
  let repo: DashboardHttpRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DashboardHttpRepository,
        {
          provide: AuthStateService,
          useValue: { getCurrentUser: () => ({ email: 'student@uam.mx' }) },
        },
      ],
    });
    repo = TestBed.inject(DashboardHttpRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads term and response from the nested active survey form', async () => {
    const pending = firstValueFrom(repo.getStudentDashboard());

    http.expectOne(API_ENDPOINTS.studentsMe).flush({
      firstName: 'Ana',
      firstLastName: 'Valeria',
      secondLastName: 'Silva',
      enrollmentId: '223300999',
      programType: 'MAESTRIA',
    });
    http.expectOne(API_ENDPOINTS.enrollmentSurveyActive).flush(activeForm);

    const data = await pending;
    expect(data.studentName).toBe('Ana Valeria Silva');
    expect(data.programType).toBe('MAESTRIA');
    expect(data.activeSurvey).toEqual({
      id: 7,
      term: '26O',
      opensAt: '2026-01-10T08:00:00Z',
      closesAt: '2026-01-25T23:59:59Z',
      hasResponded: true,
      selectedUeasCount: 2,
    });
  });

  it('falls back to the nested student when /students/me fails', async () => {
    const pending = firstValueFrom(repo.getStudentDashboard());

    http.expectOne(API_ENDPOINTS.studentsMe).flush(null, { status: 404, statusText: 'Not Found' });
    http.expectOne(API_ENDPOINTS.enrollmentSurveyActive).flush({
      ...activeForm,
      myResponse: null,
    });

    const data = await pending;
    expect(data.studentName).toBe('Ana Valeria Silva');
    expect(data.enrollmentId).toBe('223300999');
    expect(data.programType).toBe('MAESTRIA');
    expect(data.activeSurvey?.term).toBe('26O');
    expect(data.activeSurvey?.hasResponded).toBe(false);
    expect(data.activeSurvey?.selectedUeasCount).toBe(0);
  });

  it('maps survey responseCount onto the coordinator widget', async () => {
    const pending = firstValueFrom(repo.getCoordinatorMetrics());

    http.expectOne((req) => req.url === API_ENDPOINTS.students).flush({ totalElements: 4 });
    http.expectOne((req) => req.url === API_ENDPOINTS.professors).flush({ totalElements: 2 });
    http.expectOne((req) => req.url === API_ENDPOINTS.ueas).flush({ totalElements: 6 });
    http.expectOne(API_ENDPOINTS.enrollmentSurveys).flush([
      {
        id: 7,
        term: '26O',
        opensAt: '2026-01-10T08:00:00Z',
        closesAt: '2026-01-25T23:59:59Z',
        status: 'ACTIVO',
        responseCount: 11,
      },
    ]);
    http.expectOne(API_ENDPOINTS.annualPlans).flush([]);

    const metrics = await pending;
    expect(metrics.activeSurvey).toEqual({
      id: 7,
      term: '26O',
      opensAt: '2026-01-10T08:00:00Z',
      closesAt: '2026-01-25T23:59:59Z',
      status: 'ACTIVO',
      totalResponses: 11,
    });
  });
});
