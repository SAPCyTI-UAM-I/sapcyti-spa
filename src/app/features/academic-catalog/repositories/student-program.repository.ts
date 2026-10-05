import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import {
  StudentProgramResponse,
  StudentProgramSummary,
  UpdateStudentProgramRequest,
} from '../../../models';

export interface StudentProgramRepository {
  listPrograms(studentId: number): Observable<StudentProgramSummary[]>;
  getProgram(studentId: number, programId: number): Observable<StudentProgramResponse>;
  updateProgram(
    studentId: number,
    programId: number,
    body: UpdateStudentProgramRequest,
  ): Observable<StudentProgramResponse>;
}

export const STUDENT_PROGRAM_REPOSITORY = new InjectionToken<StudentProgramRepository>(
  'StudentProgramRepository',
);
