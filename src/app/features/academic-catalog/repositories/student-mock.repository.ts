import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { fromMockStore } from '../../../core/mocks/from-mock-store.util';
import { PageResponse } from '../../../models';
import {
  EnrollmentHistoryEntry,
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
    return fromMockStore(() => ({
      ...this.mockStore.getStudent(studentId),
      program: this.programMockStore.getProgramForStudent(studentId),
    }));
  }

  getEnrollmentHistory(studentId: number): Observable<EnrollmentHistoryEntry[]> {
    return fromMockStore(() => this.mockStore.getEnrollmentHistory(studentId));
  }

  updateStudent(studentId: number, request: UpdateStudentRequest): Observable<StudentCatalogItem> {
    return fromMockStore(() => this.mockStore.updateStudent(studentId, request));
  }
}
