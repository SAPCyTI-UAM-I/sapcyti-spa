import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { PageResponse } from '../../../models/page-response.model';
import {
  ProfessorCatalogItem,
  ProfessorCatalogQuery,
  RegisterProfessorRequest,
  RegisterProfessorResponse,
} from '../../../models/professor.model';
import {
  RegisterStudentRequest,
  RegisterStudentResponse,
  StudentCatalogItem,
  StudentCatalogQuery,
} from '../../../models/student.model';

@Injectable({ providedIn: 'root' })
export class AcademicCatalogMockStore {
  private students: StudentCatalogItem[] = [
    {
      id: 1,
      userId: 101,
      enrollmentId: '223300456',
      email: 'ana.garcia@uam.mx',
      graduateProgramId: 1,
      firstName: 'Ana',
      firstLastName: 'García',
      secondLastName: 'López',
      nationality: 'Mexicana',
      undergraduateDegree: 'Computación',
      programType: 'MAESTRIA',
      admissionDate: '2025-09-01',
      active: true,
    },
    {
      id: 2,
      userId: 102,
      enrollmentId: '223300457',
      email: 'roberto.jimenez@uam.mx',
      graduateProgramId: 1,
      firstName: 'Roberto',
      firstLastName: 'Jiménez',
      nationality: 'Mexicana',
      undergraduateDegree: 'Matemáticas',
      programType: 'DOCTORADO',
      admissionDate: '2024-09-01',
      active: false,
    },
  ];

  private professors: ProfessorCatalogItem[] = [
    {
      id: 10,
      userId: 201,
      employeeNumber: '30568',
      email: 'humberto.cervantes@uam.mx',
      graduateProgramId: 1,
      firstName: 'Humberto Gustavo',
      firstLastName: 'Cervantes',
      secondLastName: 'Maceda',
      active: true,
    },
    {
      id: 11,
      userId: 202,
      employeeNumber: '30910',
      email: 'laura.martinez@uam.mx',
      graduateProgramId: 1,
      firstName: 'Laura',
      firstLastName: 'Martínez',
      active: true,
    },
  ];

  listStudents(query: StudentCatalogQuery): PageResponse<StudentCatalogItem> {
    const search = this.normalize(query.search ?? '');
    const filtered = this.students.filter((student) => {
      const matchesSearch =
        !search ||
        this.normalize(
          `${student.firstName} ${student.firstLastName} ${student.secondLastName ?? ''} ${student.email} ${student.enrollmentId}`,
        ).includes(search);
      return (
        matchesSearch &&
        (!query.programType || student.programType === query.programType) &&
        (query.active === undefined || student.active === query.active)
      );
    });
    return this.page(filtered, query.page, query.size);
  }

  createStudent(request: RegisterStudentRequest): RegisterStudentResponse {
    if (
      this.students.some((student) => student.email.toLowerCase() === request.email.toLowerCase())
    ) {
      throw this.conflict('EMAIL_ALREADY_EXISTS');
    }
    if (this.students.some((student) => student.enrollmentId === request.enrollmentId)) {
      throw this.conflict('ENROLLMENT_ALREADY_EXISTS');
    }
    if (request.graduateProgramId !== 1) {
      throw this.notFound('GRADUATE_PROGRAM_NOT_FOUND');
    }

    const student: StudentCatalogItem = {
      ...request,
      id: this.nextId(this.students),
      userId: 100 + this.nextId(this.students),
      active: true,
    };
    this.students = [student, ...this.students];
    return { ...student, generatedPassword: this.generatedPassword(student.userId) };
  }

  listProfessors(query: ProfessorCatalogQuery): PageResponse<ProfessorCatalogItem> {
    const search = this.normalize(query.search ?? '');
    const filtered = this.professors.filter((professor) => {
      const matchesSearch =
        !search ||
        this.normalize(
          `${professor.firstName} ${professor.firstLastName} ${professor.secondLastName ?? ''} ${professor.email} ${professor.employeeNumber}`,
        ).includes(search);
      return matchesSearch && (query.active === undefined || professor.active === query.active);
    });
    return this.page(filtered, query.page, query.size);
  }

  createProfessor(request: RegisterProfessorRequest): RegisterProfessorResponse {
    if (
      this.professors.some(
        (professor) => professor.email.toLowerCase() === request.email.toLowerCase(),
      )
    ) {
      throw this.conflict('EMAIL_ALREADY_EXISTS');
    }
    if (this.professors.some((professor) => professor.employeeNumber === request.employeeNumber)) {
      throw this.conflict('EMPLOYEE_NUMBER_ALREADY_EXISTS');
    }
    if (request.graduateProgramId !== 1) {
      throw this.notFound('GRADUATE_PROGRAM_NOT_FOUND');
    }

    const professor: ProfessorCatalogItem = {
      ...request,
      id: this.nextId(this.professors),
      userId: 200 + this.nextId(this.professors),
      active: true,
    };
    this.professors = [professor, ...this.professors];
    return { ...professor, generatedPassword: this.generatedPassword(professor.userId) };
  }

  hasUser(userId: number): boolean {
    return [...this.students, ...this.professors].some((item) => item.userId === userId);
  }

  private page<T>(content: T[], page: number, size: number): PageResponse<T> {
    const start = page * size;
    return {
      content: content.slice(start, start + size),
      totalElements: content.length,
      totalPages: Math.ceil(content.length / size),
      size,
      number: page,
    };
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private nextId(items: readonly { id: number }[]): number {
    return Math.max(0, ...items.map((item) => item.id)) + 1;
  }

  private generatedPassword(seed: number): string {
    return `Tmp${seed}#Sap26`;
  }

  private conflict(code: string): HttpErrorResponse {
    return new HttpErrorResponse({ status: 409, error: { error: code } });
  }

  private notFound(code: string): HttpErrorResponse {
    return new HttpErrorResponse({ status: 404, error: { error: code } });
  }
}
