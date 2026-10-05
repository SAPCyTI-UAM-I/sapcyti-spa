import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import {
  StudentProgramResponse,
  StudentProgramSummary,
  UpdateStudentProgramRequest,
} from '../../../models';
import { StudentProgramRepository } from './student-program.repository';

@Injectable()
export class StudentProgramHttpRepository implements StudentProgramRepository {
  private readonly http = inject(HttpClient);

  listPrograms(studentId: number): Observable<StudentProgramSummary[]> {
    return this.http.get<StudentProgramSummary[]>(API_ENDPOINTS.studentPrograms(studentId), {
      withCredentials: true,
    });
  }

  getProgram(studentId: number, programId: number): Observable<StudentProgramResponse> {
    return this.http.get<StudentProgramResponse>(
      API_ENDPOINTS.studentProgram(studentId, programId),
      { withCredentials: true },
    );
  }

  updateProgram(
    studentId: number,
    programId: number,
    body: UpdateStudentProgramRequest,
  ): Observable<StudentProgramResponse> {
    return this.http.put<StudentProgramResponse>(
      API_ENDPOINTS.studentProgram(studentId, programId),
      body,
      { withCredentials: true },
    );
  }
}
