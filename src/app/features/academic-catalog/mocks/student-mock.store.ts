import { Injectable } from '@angular/core';

import { PageResponse } from '../../../models';
import {
  RegisterStudentRequest,
  RegisterStudentResponse,
  StudentCatalogItem,
  StudentCatalogQuery,
} from '../../../models';
import {
  generatedPassword,
  mockConflict,
  mockNotFound,
  nextId,
  normalizeSearch,
  page,
} from './catalog-mock.util';

@Injectable({ providedIn: 'root' })
export class StudentMockStore {
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
      birthDate: '1998-04-12',
      phone: '5512345678',
      phoneExtension: '101',
      undergraduateDegree: 'Computación',
      lastDegreeObtained: 'Licenciatura en Computación',
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
      birthDate: '1996-07-22',
      phone: '5587654321',
      undergraduateDegree: 'Matemáticas',
      lastDegreeObtained: 'Licenciatura en Matemáticas',
      programType: 'DOCTORADO',
      admissionDate: '2024-09-01',
      active: false,
    },
  ];

  listStudents(query: StudentCatalogQuery): PageResponse<StudentCatalogItem> {
    const search = normalizeSearch(query.search ?? '');
    const filtered = this.students.filter((student) => {
      const matchesSearch =
        !search ||
        normalizeSearch(
          `${student.firstName} ${student.firstLastName} ${student.secondLastName ?? ''} ${student.email} ${student.enrollmentId}`,
        ).includes(search);
      return (
        matchesSearch &&
        (!query.programType || student.programType === query.programType) &&
        (query.active === undefined || student.active === query.active)
      );
    });
    return page(filtered, query.page, query.size);
  }

  createStudent(request: RegisterStudentRequest): RegisterStudentResponse {
    if (
      this.students.some((student) => student.email.toLowerCase() === request.email.toLowerCase())
    ) {
      throw mockConflict('EMAIL_ALREADY_EXISTS');
    }
    if (this.students.some((student) => student.enrollmentId === request.enrollmentId)) {
      throw mockConflict('ENROLLMENT_ALREADY_EXISTS');
    }
    if (request.graduateProgramId !== 1) {
      throw mockNotFound('GRADUATE_PROGRAM_NOT_FOUND');
    }

    const student: StudentCatalogItem = {
      ...request,
      id: nextId(this.students),
      userId: 100 + nextId(this.students),
      active: true,
    };
    this.students = [student, ...this.students];
    return { ...student, generatedPassword: generatedPassword(student.userId) };
  }

  hasUser(userId: number): boolean {
    return this.students.some((student) => student.userId === userId);
  }
}
