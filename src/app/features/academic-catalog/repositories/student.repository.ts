import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { PageResponse } from '../../../models/page-response.model';
import {
  RegisterStudentRequest,
  RegisterStudentResponse,
  StudentCatalogItem,
  StudentCatalogQuery,
} from '../../../models/student.model';

export interface StudentRepository {
  listStudents(query: StudentCatalogQuery): Observable<PageResponse<StudentCatalogItem>>;
  registerStudent(request: RegisterStudentRequest): Observable<RegisterStudentResponse>;
}

export const STUDENT_REPOSITORY = new InjectionToken<StudentRepository>('StudentRepository');
