import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { provideAppMockConfig } from '../../../core/mocks/mock.config';
import { DATA_LAYER_PROVIDERS } from '../../../core/api/data-layer.providers';
import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { RegisterStudentRequest, UpdateStudentRequest } from '../../../models';
import { StudentService } from './student.service';

const request: RegisterStudentRequest = {
  enrollmentId: '223300999',
  email: 'new.student@uam.mx',
  graduateProgramId: 1,
  firstName: 'Nueva',
  firstLastName: 'Alumna',
  nationality: 'Mexicana',
  birthDate: '1999-01-15',
  phone: '5510002000',
  undergraduateDegree: 'Computación',
  lastDegreeObtained: 'LICENCIATURA',
  programType: 'MAESTRIA',
  admissionDate: '2026-09-01',
  admissionTerm: '26O',
};

const updateReq: UpdateStudentRequest = {
  firstName: 'Ana Editada',
  firstLastName: 'García',
  email: 'ana.editada@uam.mx',
  nationality: 'Mexicana',
  birthDate: '1998-04-12',
  phone: '5512345678',
  undergraduateDegree: 'Computación',
  lastDegreeObtained: 'LICENCIATURA',
  programType: 'MAESTRIA',
  admissionDate: '2025-09-01',
  admissionTerm: '25O',
  active: true,
};

describe('StudentService', () => {
  it('uses session mock for list and create', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideAppMockConfig({ students: true, studentPrograms: true }),
        ...DATA_LAYER_PROVIDERS,
        StudentService,
      ],
    });
    const service = TestBed.inject(StudentService);

    service.listStudents({ page: 0, size: 10, search: 'Ana' }).subscribe((page) => {
      expect(page.content).toHaveLength(1);
      expect(page.content[0]?.userId).toBe(101);
    });
    service.registerStudent(request).subscribe((response) => {
      expect(response.generatedPassword).toBeTruthy();
      expect(response.active).toBe(true);
    });
    service.getStudent(1).subscribe((detail) => {
      expect(detail.id).toBe(1);
      expect(detail.program.enrollmentId).toBe('2024630001');
    });
    service.updateStudent(1, updateReq).subscribe((response) => {
      expect(response.firstName).toBe('Ana Editada');
      expect(response.email).toBe('ana.editada@uam.mx');
    });
  });

  it('builds the HTTP list URL and query parameters', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppMockConfig({ students: false }),
        ...DATA_LAYER_PROVIDERS,
        StudentService,
      ],
    });
    const service = TestBed.inject(StudentService);
    const http = TestBed.inject(HttpTestingController);

    service
      .listStudents({
        page: 2,
        size: 10,
        search: 'ana',
        programType: 'MAESTRIA',
        active: true,
      })
      .subscribe();

    const req = http.expectOne(
      (candidate) =>
        candidate.url === API_ENDPOINTS.students &&
        candidate.params.get('page') === '2' &&
        candidate.params.get('programType') === 'MAESTRIA' &&
        candidate.params.get('active') === 'true',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 0, totalPages: 0, size: 10, number: 2 });
    http.verify();
  });

  it('posts the aligned creation payload', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppMockConfig({ students: false }),
        ...DATA_LAYER_PROVIDERS,
        StudentService,
      ],
    });
    const service = TestBed.inject(StudentService);
    const http = TestBed.inject(HttpTestingController);

    service.registerStudent(request).subscribe();
    const req = http.expectOne(API_ENDPOINTS.students);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ ...request, id: 3, userId: 103, active: true, generatedPassword: 'Temp1234' });
    http.verify();
  });

  it('gets student details via HTTP', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppMockConfig({ students: false }),
        ...DATA_LAYER_PROVIDERS,
        StudentService,
      ],
    });
    const service = TestBed.inject(StudentService);
    const http = TestBed.inject(HttpTestingController);

    service.getStudent(1).subscribe();
    const req = http.expectOne(API_ENDPOINTS.student(1));
    expect(req.request.method).toBe('GET');
    req.flush({ id: 1, firstName: 'Ana' });
    http.verify();
  });

  it('updates student details via HTTP', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppMockConfig({ students: false }),
        ...DATA_LAYER_PROVIDERS,
        StudentService,
      ],
    });
    const service = TestBed.inject(StudentService);
    const http = TestBed.inject(HttpTestingController);

    service.updateStudent(1, updateReq).subscribe();
    const req = http.expectOne(API_ENDPOINTS.student(1));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateReq);
    req.flush({ id: 1, ...updateReq });
    http.verify();
  });
});
