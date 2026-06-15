import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PageResponse } from '../../../models/page-response.model';
import {
  RegisterStudentRequest,
  RegisterStudentResponse,
  StudentCatalogItem,
  StudentCatalogQuery,
} from '../../../models/student.model';
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
}
