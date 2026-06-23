import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import {
  StudentProgramResponse,
  StudentProgramSummary,
  UpdateStudentProgramRequest,
} from '../../../models';
import { StudentProgramMockStore } from '../mocks/student-program-mock.store';
import { StudentProgramRepository } from './student-program.repository';

@Injectable()
export class StudentProgramMockRepository implements StudentProgramRepository {
  private readonly mockStore = inject(StudentProgramMockStore);

  listPrograms(studentId: number): Observable<StudentProgramSummary[]> {
    return of(this.mockStore.listPrograms(studentId));
  }

  getProgram(studentId: number, programId: number): Observable<StudentProgramResponse> {
    try {
      return of(this.mockStore.getProgram(studentId, programId));
    } catch (error) {
      return throwError(() => error);
    }
  }

  updateProgram(
    studentId: number,
    programId: number,
    body: UpdateStudentProgramRequest,
  ): Observable<StudentProgramResponse> {
    try {
      return of(this.mockStore.updateProgram(studentId, programId, body));
    } catch (error) {
      return throwError(() => error);
    }
  }
}
