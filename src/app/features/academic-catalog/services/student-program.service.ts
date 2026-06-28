import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  StudentProgramResponse,
  StudentProgramSummary,
  UpdateStudentProgramRequest,
} from '../../../models';
import { STUDENT_PROGRAM_REPOSITORY } from '../repositories/student-program.repository';

@Injectable({ providedIn: 'root' })
export class StudentProgramService {
  private readonly repository = inject(STUDENT_PROGRAM_REPOSITORY);

  listPrograms(studentId: number): Observable<StudentProgramSummary[]> {
    return this.repository.listPrograms(studentId);
  }

  getProgram(studentId: number, programId: number): Observable<StudentProgramResponse> {
    return this.repository.getProgram(studentId, programId);
  }

  updateProgram(
    studentId: number,
    programId: number,
    body: UpdateStudentProgramRequest,
  ): Observable<StudentProgramResponse> {
    return this.repository.updateProgram(studentId, programId, body);
  }
}
