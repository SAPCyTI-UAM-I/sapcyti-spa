import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { PageResponse } from '../../../models/page-response.model';
import {
  RegisterStudentRequest,
  RegisterStudentResponse,
  StudentCatalogItem,
  StudentCatalogQuery,
} from '../../../models/student.model';
import { AcademicCatalogMockStore } from '../mocks/academic-catalog-mock.store';
import { StudentRepository } from './student.repository';

@Injectable()
export class StudentMockRepository implements StudentRepository {
  private readonly mockStore = inject(AcademicCatalogMockStore);

  listStudents(query: StudentCatalogQuery): Observable<PageResponse<StudentCatalogItem>> {
    return of(this.mockStore.listStudents(query));
  }

  registerStudent(request: RegisterStudentRequest): Observable<RegisterStudentResponse> {
    return of(this.mockStore.createStudent(request));
  }
}
