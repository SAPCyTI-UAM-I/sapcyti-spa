import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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
import { STUDENT_REPOSITORY } from '../repositories/student.repository';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly repository = inject(STUDENT_REPOSITORY);

  listStudents(query: StudentCatalogQuery): Observable<PageResponse<StudentCatalogItem>> {
    return this.repository.listStudents(query);
  }

  registerStudent(request: RegisterStudentRequest): Observable<RegisterStudentResponse> {
    return this.repository.registerStudent(request);
  }

  getStudent(studentId: number): Observable<StudentDetailResponse> {
    return this.repository.getStudent(studentId);
  }

  getEnrollmentHistory(studentId: number): Observable<EnrollmentHistoryEntry[]> {
    return this.repository.getEnrollmentHistory(studentId);
  }

  updateStudent(studentId: number, request: UpdateStudentRequest): Observable<StudentCatalogItem> {
    return this.repository.updateStudent(studentId, request);
  }
}
