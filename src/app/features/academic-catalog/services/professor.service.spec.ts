import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { provideAppMockConfig } from '../../../core/mocks/mock.config';
import { DATA_LAYER_PROVIDERS } from '../../../core/api/data-layer.providers';
import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { RegisterProfessorRequest } from '../../../models';
import { ProfessorService } from './professor.service';

describe('ProfessorService', () => {
  const request: RegisterProfessorRequest = {
    employeeNumber: '40001',
    email: 'new.professor@uam.mx',
    graduateProgramId: 1,
    firstName: 'Nueva',
    firstLastName: 'Profesora',
    phone: '5510002000',
    commissionMember: false,
  };

  it('uses session mock and keeps generatedPassword creation-only', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideAppMockConfig({ professors: true }),
        ...DATA_LAYER_PROVIDERS,
        ProfessorService,
      ],
    });
    const service = TestBed.inject(ProfessorService);

    service.registerProfessor(request).subscribe((response) => {
      expect(response.generatedPassword).toBeTruthy();
      expect(response.userId).toBeGreaterThan(0);
    });
    service.listProfessors({ page: 0, size: 10 }).subscribe((page) => {
      expect('generatedPassword' in page.content[0]!).toBe(false);
    });
  });

  it('uses GET and POST professor endpoints in HTTP mode', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppMockConfig({ professors: false }),
        ...DATA_LAYER_PROVIDERS,
        ProfessorService,
      ],
    });
    const service = TestBed.inject(ProfessorService);
    const http = TestBed.inject(HttpTestingController);

    service.listProfessors({ page: 0, size: 10, active: true }).subscribe();
    const listReq = http.expectOne(
      (candidate) =>
        candidate.url === API_ENDPOINTS.professors && candidate.params.get('active') === 'true',
    );
    expect(listReq.request.method).toBe('GET');
    listReq.flush({ content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 });

    service.registerProfessor(request).subscribe();
    const createReq = http.expectOne(API_ENDPOINTS.professors);
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.body).toEqual(request);
    createReq.flush({
      ...request,
      id: 12,
      userId: 212,
      active: true,
      generatedPassword: 'Temp1234',
    });
    http.verify();
  });
});
