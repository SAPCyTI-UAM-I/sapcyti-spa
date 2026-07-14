import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { DATA_LAYER_PROVIDERS } from '../../../core/api/data-layer.providers';
import { provideAppMockConfig } from '../../../core/mocks/mock.config';
import { EnrollmentSurveyService } from './enrollment-survey.service';

const mockProviders = [
  provideHttpClient(),
  provideAppMockConfig({ enrollmentSurvey: true }),
  ...DATA_LAYER_PROVIDERS,
  EnrollmentSurveyService,
];

describe('EnrollmentSurveyService (mock mode)', () => {
  let service: EnrollmentSurveyService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: mockProviders });
    service = TestBed.inject(EnrollmentSurveyService);
  });

  it('lists seeded surveys, most recent first', () => {
    service.listSurveys().subscribe((surveys) => {
      expect(surveys.length).toBeGreaterThan(0);
      expect(surveys[0]!.id).toBeGreaterThanOrEqual(surveys[surveys.length - 1]!.id);
    });
  });

  it('rejects a duplicate term with 409', async () => {
    await expect(
      new Promise((resolve, reject) => {
        service
          .createSurvey({ term: '26O', opensAt: futureIso(1), closesAt: futureIso(5) })
          .subscribe({ next: () => reject(new Error('expected failure')), error: resolve });
      }),
    ).resolves.toMatchObject({ status: 409 });
  });

  it('rejects closesAt before opensAt with 400', async () => {
    await expect(
      new Promise((resolve, reject) => {
        service
          .createSurvey({ term: '30O', opensAt: futureIso(5), closesAt: futureIso(1) })
          .subscribe({ next: () => reject(new Error('expected failure')), error: resolve });
      }),
    ).resolves.toMatchObject({ status: 400 });
  });

  it('returns an active survey form with removed UEA claves', () => {
    service.getActiveSurvey().subscribe((form) => {
      expect(form).not.toBeNull();
      expect(form!.survey.status).toBe('ACTIVO');
      expect(form!.removedUeaClaves.length).toBeGreaterThan(0);
    });
  });

  it('summary counts add up (responded + pending = eligible)', () => {
    service.getResultsSummary(2).subscribe((summary) => {
      expect(summary.respondedCount + summary.pendingCount).toBe(summary.eligibleCount);
    });
  });

  it('sorts UEA demand rows by totalResponses desc', () => {
    service.getResultsUeas(2, 'totalResponses,desc').subscribe((rows) => {
      const totals = rows.map((r) => r.totalResponses);
      expect(totals).toEqual([...totals].sort((a, b) => b - a));
    });
  });
});

describe('EnrollmentSurveyService (HTTP mode)', () => {
  let service: EnrollmentSurveyService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppMockConfig({ enrollmentSurvey: false }),
        ...DATA_LAYER_PROVIDERS,
        EnrollmentSurveyService,
      ],
    });
    service = TestBed.inject(EnrollmentSurveyService);
    http = TestBed.inject(HttpTestingController);
  });

  it('maps a 404 on /active to null instead of erroring', () => {
    let result: unknown = 'unset';
    service.getActiveSurvey().subscribe((value) => (result = value));
    http
      .expectOne(API_ENDPOINTS.enrollmentSurveyActive)
      .flush({ error: 'SURVEY_NOT_FOUND' }, { status: 404, statusText: 'Not Found' });
    expect(result).toBeNull();
  });

  it('sends the sort param on results/ueas', () => {
    service.getResultsUeas(7, 'totalResponses,desc').subscribe();
    const req = http.expectOne(
      (candidate) =>
        candidate.url === API_ENDPOINTS.enrollmentSurveyResultsUeas(7) &&
        candidate.params.get('sort') === 'totalResponses,desc',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
    http.verify();
  });

  it('closes a survey via PUT /close', () => {
    service.closeSurvey(7).subscribe();
    const req = http.expectOne(API_ENDPOINTS.enrollmentSurveyClose(7));
    expect(req.request.method).toBe('PUT');
    req.flush({});
    http.verify();
  });
});

function futureIso(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 24 * 3_600_000).toISOString();
}
