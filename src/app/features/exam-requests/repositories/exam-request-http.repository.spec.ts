import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { EXAM_STUDENT_OPERATION } from '../../../core/http/tokens/exam-context.tokens';
import { ExamOptionsDto, ExamRequirementsResponse } from '../../../models';
import { ExamRequestHttpRepository } from './exam-request-http.repository';

const options: ExamOptionsDto = {
  degree: 'MAESTRIA',
  programStatus: 'EGRESADO',
  eligible: true,
  eligibilityReason: null,
  examTypes: ['GRADO'],
};

const requirements: ExamRequirementsResponse = {
  examType: 'GRADO',
  degree: 'MAESTRIA',
  programStatus: 'EGRESADO',
  eligible: true,
  eligibilityReason: null,
  request: null,
  requirements: [],
};

describe('ExamRequestHttpRepository', () => {
  let repo: ExamRequestHttpRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ExamRequestHttpRepository],
    });
    repo = TestBed.inject(ExamRequestHttpRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads options from the configured URL without exam write context', async () => {
    const pending = firstValueFrom(repo.getOptions());

    const req = http.expectOne(API_ENDPOINTS.examRequests.me.options);
    expect(req.request.method).toBe('GET');
    expect(req.request.context.get(EXAM_STUDENT_OPERATION)).toBe(false);
    req.flush(options);

    await expect(pending).resolves.toEqual(options);
  });

  it('reads GRADO requirements from the configured URL', async () => {
    const pending = firstValueFrom(repo.getRequirements('GRADO'));

    const req = http.expectOne(API_ENDPOINTS.examRequests.me.requirements('GRADO'));
    expect(req.request.method).toBe('GET');
    expect(req.request.context.get(EXAM_STUDENT_OPERATION)).toBe(false);
    req.flush(requirements);

    await expect(pending).resolves.toEqual(requirements);
  });

  it('propagates a security 403 FORBIDDEN', async () => {
    const pending = firstValueFrom(repo.getOptions());

    http
      .expectOne(API_ENDPOINTS.examRequests.me.options)
      .flush(
        { error: 'FORBIDDEN', message: 'Access denied' },
        { status: 403, statusText: 'Forbidden' },
      );

    await expect(pending).rejects.toMatchObject({
      status: 403,
      error: { error: 'FORBIDDEN' },
    });
  });

  it('propagates a business 403 PROGRAM_NOT_ELIGIBLE', async () => {
    const pending = firstValueFrom(repo.getRequirements('GRADO'));

    http
      .expectOne(API_ENDPOINTS.examRequests.me.requirements('GRADO'))
      .flush(
        { error: 'PROGRAM_NOT_ELIGIBLE', message: 'Program is not eligible' },
        { status: 403, statusText: 'Forbidden' },
      );

    await expect(pending).rejects.toMatchObject({
      status: 403,
      error: { error: 'PROGRAM_NOT_ELIGIBLE' },
    });
  });
});
