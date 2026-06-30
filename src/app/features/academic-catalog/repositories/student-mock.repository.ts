import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import { PageResponse } from '../../../models';
import {
  RegisterStudentRequest,
  RegisterStudentResponse,
  StudentCatalogItem,
  StudentCatalogQuery,
  StudentDetailResponse,
  UpdateStudentRequest,
} from '../../../models';
import { StudentMockStore } from '../mocks/student-mock.store';
import { StudentProgramMockStore } from '../mocks/student-program-mock.store';
import { StudentRepository } from './student.repository';

@Injectable()
export class StudentMockRepository implements StudentRepository {
  private readonly mockStore = inject(StudentMockStore);
  private readonly programMockStore = inject(StudentProgramMockStore);

  listStudents(query: StudentCatalogQuery): Observable<PageResponse<StudentCatalogItem>> {
    return of(this.mockStore.listStudents(query));
  }

  registerStudent(request: RegisterStudentRequest): Observable<RegisterStudentResponse> {
    return of(this.mockStore.createStudent(request));
  }

  getStudent(studentId: number): Observable<StudentDetailResponse> {
    try {
      const student = this.mockStore.getStudent(studentId);
      const program = this.programMockStore.getProgramForStudent(studentId);
      return of({
        ...student,
        program,
      });
    } catch (error) {
      return throwError(() => error);
    }
  }

  updateStudent(studentId: number, request: UpdateStudentRequest): Observable<StudentCatalogItem> {
    try {
      return of(this.mockStore.updateStudent(studentId, request));
    } catch (error) {
      return throwError(() => error);
    }
  }
}
