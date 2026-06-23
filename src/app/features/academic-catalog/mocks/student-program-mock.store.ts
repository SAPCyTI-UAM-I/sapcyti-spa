import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import {
  ProfessorReference,
  StudentCatalogItem,
  StudentProgramResponse,
  StudentProgramSummary,
  UpdateStudentProgramRequest,
} from '../../../models';
import { nextId } from './catalog-mock.util';
import { ProfessorMockStore } from './professor-mock.store';

function mockBadRequest(message: string): HttpErrorResponse {
  return new HttpErrorResponse({
    status: 400,
    error: { error: 'VALIDATION_ERROR', message },
  });
}

@Injectable({ providedIn: 'root' })
export class StudentProgramMockStore {
  private readonly professorStore = inject(ProfessorMockStore);

  private programs: StudentProgramResponse[] = [
    {
      id: 100,
      studentId: 1,
      graduateProgramId: 1,
      enrollmentId: '223300456',
      programType: 'MAESTRIA',
      admissionDate: '2025-09-01',
      status: 'ACTIVO',
      advisorIds: [],
      advisors: [],
    },
    {
      id: 101,
      studentId: 2,
      graduateProgramId: 1,
      enrollmentId: '223300457',
      programType: 'DOCTORADO',
      admissionDate: '2024-09-01',
      status: 'ACTIVO',
      advisorIds: [],
      advisors: [],
    },
    {
      id: 102,
      studentId: 3,
      graduateProgramId: 1,
      enrollmentId: '223300458',
      programType: 'MAESTRIA',
      admissionDate: '2023-09-01',
      status: 'ACTIVO',
      advisorIds: [],
      advisors: [],
    },
    {
      id: 103,
      studentId: 3,
      graduateProgramId: 1,
      enrollmentId: '223300458',
      programType: 'DOCTORADO',
      admissionDate: '2025-09-01',
      status: 'ACTIVO',
      advisorIds: [],
      advisors: [],
    },
  ];

  listPrograms(studentId: number): StudentProgramSummary[] {
    return this.programs
      .filter((program) => program.studentId === studentId)
      .map((program) => this.toSummary(program));
  }

  getProgram(studentId: number, programId: number): StudentProgramResponse {
    const program = this.findProgram(studentId, programId);
    if (!program) {
      throw this.programNotFound();
    }
    return this.withResolvedProfessors(program);
  }

  updateProgram(
    studentId: number,
    programId: number,
    body: UpdateStudentProgramRequest,
  ): StudentProgramResponse {
    const index = this.programs.findIndex(
      (program) => program.studentId === studentId && program.id === programId,
    );
    if (index < 0) {
      throw this.programNotFound();
    }

    this.validateUpdate(body);

    const tutorId = body.tutorId === null ? undefined : body.tutorId;
    if (tutorId !== undefined) {
      this.assertProfessorExists(tutorId);
    }
    for (const advisorId of body.advisorIds) {
      this.assertProfessorExists(advisorId);
    }

    const current = this.programs[index]!;
    const updated: StudentProgramResponse = {
      ...current,
      admissionDate: body.admissionDate,
      graduationDate: body.graduationDate,
      researchArea: body.researchArea,
      status: body.status,
      withdrawalReason: body.withdrawalReason,
      tutorId,
      tutor: tutorId !== undefined ? this.resolveProfessor(tutorId) : undefined,
      advisorIds: [...body.advisorIds],
      advisors: body.advisorIds
        .map((id) => this.resolveProfessor(id))
        .filter((professor): professor is ProfessorReference => professor !== undefined),
    };

    this.programs = [...this.programs.slice(0, index), updated, ...this.programs.slice(index + 1)];
    return this.withResolvedProfessors(updated);
  }

  createProgramForStudent(student: StudentCatalogItem): void {
    const program: StudentProgramResponse = {
      id: nextId(this.programs),
      studentId: student.id,
      graduateProgramId: student.graduateProgramId,
      enrollmentId: student.enrollmentId,
      programType: student.programType,
      admissionDate: student.admissionDate,
      status: 'ACTIVO',
      advisorIds: [],
      advisors: [],
    };
    this.programs = [...this.programs, program];
  }

  private findProgram(studentId: number, programId: number): StudentProgramResponse | undefined {
    return this.programs.find(
      (program) => program.studentId === studentId && program.id === programId,
    );
  }

  private toSummary(program: StudentProgramResponse): StudentProgramSummary {
    return {
      id: program.id,
      programType: program.programType,
      enrollmentId: program.enrollmentId,
      status: program.status,
      tutorId: program.tutorId,
      hasTutor: program.tutorId != null,
    };
  }

  private withResolvedProfessors(program: StudentProgramResponse): StudentProgramResponse {
    return {
      ...program,
      tutor: program.tutorId !== undefined ? this.resolveProfessor(program.tutorId) : undefined,
      advisors: program.advisorIds
        .map((id) => this.resolveProfessor(id))
        .filter((professor): professor is ProfessorReference => professor !== undefined),
    };
  }

  private resolveProfessor(id: number): ProfessorReference | undefined {
    const page = this.professorStore.listProfessors({ page: 0, size: 100 });
    const professor = page.content.find((item) => item.id === id);
    if (!professor) {
      return undefined;
    }
    return {
      id: professor.id,
      firstName: professor.firstName,
      firstLastName: professor.firstLastName,
      secondLastName: professor.secondLastName,
    };
  }

  private assertProfessorExists(id: number): void {
    if (!this.resolveProfessor(id)) {
      throw new HttpErrorResponse({
        status: 404,
        error: { error: 'NOT_FOUND', message: 'Professor not found' },
      });
    }
  }

  private validateUpdate(body: UpdateStudentProgramRequest): void {
    if (body.status === 'BAJA' && !body.withdrawalReason?.trim()) {
      throw mockBadRequest('Withdrawal reason is required when status is BAJA');
    }
    if (body.graduationDate && body.admissionDate && body.graduationDate < body.admissionDate) {
      throw mockBadRequest('Graduation date must be on or after admission date');
    }
    if (new Set(body.advisorIds).size !== body.advisorIds.length) {
      throw mockBadRequest('Advisor ids must be unique');
    }
  }

  private programNotFound(): HttpErrorResponse {
    return new HttpErrorResponse({
      status: 404,
      error: { error: 'NOT_FOUND', message: 'Student program not found' },
    });
  }
}
