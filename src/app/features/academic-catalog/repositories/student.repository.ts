import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { PageResponse } from '../../../models';
import {
  RegisterStudentRequest,
  RegisterStudentResponse,
  StudentCatalogItem,
  StudentCatalogQuery,
  StudentDetailResponse,
  UpdateStudentRequest,
} from '../../../models';

export interface StudentRepository {
  listStudents(query: StudentCatalogQuery): Observable<PageResponse<StudentCatalogItem>>;
  registerStudent(request: RegisterStudentRequest): Observable<RegisterStudentResponse>;
  getStudent(studentId: number): Observable<StudentDetailResponse>;
  updateStudent(studentId: number, request: UpdateStudentRequest): Observable<StudentCatalogItem>;
}

export const STUDENT_REPOSITORY = new InjectionToken<StudentRepository>('StudentRepository');
