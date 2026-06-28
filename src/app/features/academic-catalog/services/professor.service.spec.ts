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
    professorType: 'INTERNO',
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
      expect(response.professorType).toBe('INTERNO');
    });
    service.listProfessors({ page: 0, size: 10 }).subscribe((page) => {
      expect('generatedPassword' in page.content[0]!).toBe(false);
    });
  });

  it('supports get, update and deactivate in mock mode', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideAppMockConfig({ professors: true }),
        ...DATA_LAYER_PROVIDERS,
        ProfessorService,
      ],
    });
    const service = TestBed.inject(ProfessorService);

    service.getProfessor(11).subscribe((professor) => {
      expect(professor.id).toBe(11);
      expect(professor.active).toBe(true);
    });

    service
      .updateProfessor(11, {
        professorType: 'EXTERNO',
        email: 'laura.martinez@uam.mx',
        firstName: 'Laura',
        firstLastName: 'Martínez',
        phone: '5544455566',
        commissionMember: false,
      })
      .subscribe((professor) => {
        expect(professor.professorType).toBe('EXTERNO');
        expect(professor.employeeNumber).toBeNull();
      });

    service.deactivateProfessor(11).subscribe((professor) => {
      expect(professor.active).toBe(false);
    });
  });

  it('blocks deactivation when professor has active assignments', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideAppMockConfig({ professors: true }),
        ...DATA_LAYER_PROVIDERS,
        ProfessorService,
      ],
    });
    const service = TestBed.inject(ProfessorService);

    await expect(
      new Promise((resolve, reject) => {
        service.deactivateProfessor(10).subscribe({
          next: () => reject(new Error('Expected deactivation to fail')),
          error: (error) => resolve(error),
        });
      }),
    ).resolves.toMatchObject({ status: 409 });
  });

  it('uses professor HTTP endpoints in HTTP mode', () => {
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
    createReq.flush({
      ...request,
      id: 12,
      userId: 212,
      active: true,
      generatedPassword: 'Temp1234',
    });

    service.getProfessor(12).subscribe();
    http.expectOne(API_ENDPOINTS.professor(12)).flush({
      ...request,
      id: 12,
      userId: 212,
      active: true,
    });

    service
      .updateProfessor(12, {
        professorType: 'INTERNO',
        employeeNumber: '40001',
        email: 'new.professor@uam.mx',
        firstName: 'Nueva',
        firstLastName: 'Profesora',
        phone: '5510002000',
        commissionMember: false,
      })
      .subscribe();
    const updateReq = http.expectOne(API_ENDPOINTS.professor(12));
    expect(updateReq.request.method).toBe('PUT');
    updateReq.flush({ ...request, id: 12, userId: 212, active: true });

    service.deactivateProfessor(12).subscribe();
    const deactivateReq = http.expectOne(API_ENDPOINTS.professorDeactivate(12));
    expect(deactivateReq.request.method).toBe('PUT');
    deactivateReq.flush({ ...request, id: 12, userId: 212, active: false });

    http.verify();
  });
});
