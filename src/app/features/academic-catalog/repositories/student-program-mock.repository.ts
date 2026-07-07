import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { fromMockStore } from '../../../core/mocks/from-mock-store.util';
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
    return fromMockStore(() => this.mockStore.getProgram(studentId, programId));
  }

  updateProgram(
    studentId: number,
    programId: number,
    body: UpdateStudentProgramRequest,
  ): Observable<StudentProgramResponse> {
    return fromMockStore(() => this.mockStore.updateProgram(studentId, programId, body));
  }
}
