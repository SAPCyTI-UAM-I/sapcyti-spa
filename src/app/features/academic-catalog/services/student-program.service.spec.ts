import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { provideAppMockConfig } from '../../../core/mocks/mock.config';
import { DATA_LAYER_PROVIDERS } from '../../../core/api/data-layer.providers';
import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import {
  StudentProgramResponse,
  StudentProgramSummary,
  UpdateStudentProgramRequest,
} from '../../../models';
import { StudentProgramService } from './student-program.service';

const updateRequest: UpdateStudentProgramRequest = {
  admissionDate: '2025-09-01',
  status: 'ACTIVO',
  tutorId: 10,
  advisorIds: [11],
};

describe('StudentProgramService', () => {
  it('uses session mock for list, get, and update', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideAppMockConfig({ studentPrograms: true }),
        ...DATA_LAYER_PROVIDERS,
        StudentProgramService,
      ],
    });
    const service = TestBed.inject(StudentProgramService);

    // Se capturan los valores y se asegura fuera del subscribe: un expect que falla
    // dentro del callback lo traga RxJS y la prueba queda verde igual.
    let programs: StudentProgramSummary[] | undefined;
    service.listPrograms(1).subscribe((value) => (programs = value));
    expect(programs).toHaveLength(1);
    expect(programs?.[0]?.id).toBe(100);
    expect(programs?.[0]?.programType).toBe('MAESTRIA');

    let program: StudentProgramResponse | undefined;
    service.getProgram(1, 100).subscribe((value) => (program = value));
    expect(program?.enrollmentId).toBe('2024630001');
    expect(program?.studentId).toBe(1);

    let updated: StudentProgramResponse | undefined;
    service.updateProgram(1, 100, updateRequest).subscribe((value) => (updated = value));
    expect(updated?.tutorId).toBe(10);
    expect(updated?.advisorIds).toEqual([11]);
  });

  it('returns a single program for student 3 in mock mode', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideAppMockConfig({ studentPrograms: true }),
        ...DATA_LAYER_PROVIDERS,
        StudentProgramService,
      ],
    });
    const service = TestBed.inject(StudentProgramService);

    let programs: StudentProgramSummary[] | undefined;
    service.listPrograms(3).subscribe((value) => (programs = value));
    expect(programs).toHaveLength(1);
    expect(programs?.[0]?.id).toBe(102);
    expect(programs?.[0]?.programType).toBe('DOCTORADO');
  });

  it('builds the HTTP list URL', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppMockConfig({ studentPrograms: false }),
        ...DATA_LAYER_PROVIDERS,
        StudentProgramService,
      ],
    });
    const service = TestBed.inject(StudentProgramService);
    const http = TestBed.inject(HttpTestingController);

    service.listPrograms(1).subscribe();

    const req = http.expectOne(API_ENDPOINTS.studentPrograms(1));
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
    http.verify();
  });

  it('builds the HTTP detail URL', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppMockConfig({ studentPrograms: false }),
        ...DATA_LAYER_PROVIDERS,
        StudentProgramService,
      ],
    });
    const service = TestBed.inject(StudentProgramService);
    const http = TestBed.inject(HttpTestingController);

    service.getProgram(1, 100).subscribe();

    const req = http.expectOne(API_ENDPOINTS.studentProgram(1, 100));
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush({
      id: 100,
      studentId: 1,
      graduateProgramId: 1,
      enrollmentId: '223300456',
      programType: 'MAESTRIA',
      admissionDate: '2025-09-01',
      status: 'ACTIVO',
      advisorIds: [],
      advisors: [],
    });
    http.verify();
  });

  it('puts the aligned update payload', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppMockConfig({ studentPrograms: false }),
        ...DATA_LAYER_PROVIDERS,
        StudentProgramService,
      ],
    });
    const service = TestBed.inject(StudentProgramService);
    const http = TestBed.inject(HttpTestingController);

    service.updateProgram(1, 100, updateRequest).subscribe();
    const req = http.expectOne(API_ENDPOINTS.studentProgram(1, 100));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateRequest);
    expect(req.request.withCredentials).toBe(true);
    req.flush({
      id: 100,
      studentId: 1,
      graduateProgramId: 1,
      enrollmentId: '223300456',
      programType: 'MAESTRIA',
      admissionDate: '2025-09-01',
      status: 'ACTIVO',
      tutorId: 10,
      advisorIds: [11],
      advisors: [],
    });
    http.verify();
  });
});
