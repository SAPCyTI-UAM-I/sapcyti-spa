import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { PageResponse } from '../../../models';
import {
  RegisterStudentRequest,
  RegisterStudentResponse,
  StudentCatalogItem,
  StudentCatalogQuery,
  StudentDetailResponse,
  UpdateStudentRequest,
} from '../../../models';
import { StudentRepository } from './student.repository';

@Injectable()
export class StudentHttpRepository implements StudentRepository {
  private readonly http = inject(HttpClient);

  listStudents(query: StudentCatalogQuery): Observable<PageResponse<StudentCatalogItem>> {
    let params = new HttpParams().set('page', query.page).set('size', query.size);
    if (query.search) params = params.set('search', query.search);
    if (query.programType) params = params.set('programType', query.programType);
    if (query.active !== undefined) params = params.set('active', query.active);
    return this.http.get<PageResponse<StudentCatalogItem>>(API_ENDPOINTS.students, {
      params,
      withCredentials: true,
    });
  }

  registerStudent(request: RegisterStudentRequest): Observable<RegisterStudentResponse> {
    return this.http.post<RegisterStudentResponse>(API_ENDPOINTS.students, request, {
      withCredentials: true,
    });
  }

  getStudent(studentId: number): Observable<StudentDetailResponse> {
    return this.http.get<StudentDetailResponse>(API_ENDPOINTS.student(studentId), {
      withCredentials: true,
    });
  }

  updateStudent(studentId: number, request: UpdateStudentRequest): Observable<StudentCatalogItem> {
    return this.http.put<StudentCatalogItem>(API_ENDPOINTS.student(studentId), request, {
      withCredentials: true,
    });
  }
}
