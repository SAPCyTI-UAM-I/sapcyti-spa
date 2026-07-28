import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import {
  ProfessorReference,
  RegisterStudentRequest,
  StudentCatalogItem,
  StudentProgramResponse,
  StudentProgramSummary,
  UpdateStudentProgramRequest,
} from '../../../models';
import { ENROLLED_STUDENTS_SEED } from '../../../shared/mocks/enrolled-students.mock-data';
import { mockBadRequest, nextId } from './catalog-mock.util';
import { ProfessorMockStore } from './professor-mock.store';
import { validateProgramCatalogFields } from '../utils/student-program-form.util';

/** Datos de programa que no salen del padrón; solo para que el detalle no se vea vacío. */
const PROGRAM_EXTRAS: Record<number, Partial<StudentProgramResponse>> = {
  1: { tutorId: 10 },
  3: {
    lineOfKnowledge: 'Ciencias e Ingeniería de la Computación',
    researchArea: 'Inteligencia artificial',
    tutorId: 10,
    advisorIds: [12],
  },
};

@Injectable({ providedIn: 'root' })
export class StudentProgramMockStore {
  private readonly professorStore = inject(ProfessorMockStore);

  /**
   * Un programa por alumno del padrón compartido. Se deriva del seed en vez de listarse a
   * mano porque cada alumno del catálogo **debe** tener programa: `getProgramForStudent`
   * lanza 404 si falta, y el detalle del alumno no abre.
   */
  private programs: StudentProgramResponse[] = ENROLLED_STUDENTS_SEED.map((student, index) => ({
    id: 100 + index,
    studentId: student.id,
    graduateProgramId: 1,
    enrollmentId: student.enrollmentId,
    programType: student.programType,
    admissionDate: student.admissionDate,
    status: student.active ? 'ACTIVO' : 'BAJA',
    withdrawalReason: student.active ? undefined : 'Baja por abandono de estudios',
    advisors: [],
    advisorIds: [],
    ...PROGRAM_EXTRAS[student.id],
  }));

  listPrograms(studentId: number): StudentProgramSummary[] {
    return this.programs
      .filter((program) => program.studentId === studentId)
      .map((program) => this.toSummary(program));
  }

  getProgramForStudent(studentId: number): StudentProgramResponse {
    const program = this.programs.find((p) => p.studentId === studentId);
    if (!program) {
      throw this.programNotFound();
    }
    return this.withResolvedProfessors(program);
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
      lineOfKnowledge: body.lineOfKnowledge,
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

  createProgramForStudent(student: StudentCatalogItem, request: RegisterStudentRequest): void {
    this.validateRegistrationProgramFields(request);

    const tutorId = request.tutorId === null ? undefined : request.tutorId;
    if (tutorId !== undefined) {
      this.assertProfessorExists(tutorId);
    }

    const advisorIds = request.advisorIds ?? [];
    for (const advisorId of advisorIds) {
      this.assertProfessorExists(advisorId);
    }

    const program: StudentProgramResponse = {
      id: nextId(this.programs),
      studentId: student.id,
      graduateProgramId: student.graduateProgramId,
      enrollmentId: student.enrollmentId,
      programType: student.programType,
      admissionDate: student.admissionDate,
      status: 'ACTIVO',
      lineOfKnowledge: request.lineOfKnowledge,
      researchArea: request.researchArea,
      tutorId,
      tutor: tutorId !== undefined ? this.resolveProfessor(tutorId) : undefined,
      advisorIds: [...advisorIds],
      advisors: advisorIds
        .map((id) => this.resolveProfessor(id))
        .filter((professor): professor is ProfessorReference => professor !== undefined),
    };
    this.programs = [...this.programs, program];
  }

  validateRegistrationProgramFields(request: RegisterStudentRequest): void {
    const validationError = validateProgramCatalogFields({
      lineOfKnowledge: request.lineOfKnowledge,
      researchArea: request.researchArea,
      advisorIds: request.advisorIds,
    });
    if (validationError) {
      throw mockBadRequest(validationError);
    }
  }

  hasActiveAssignment(professorId: number): boolean {
    return this.programs.some(
      (program) =>
        program.status === 'ACTIVO' &&
        (program.tutorId === professorId || program.advisorIds.includes(professorId)),
    );
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
      active: professor.active,
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

    const validationError = validateProgramCatalogFields({
      lineOfKnowledge: body.lineOfKnowledge,
      researchArea: body.researchArea,
      advisorIds: body.advisorIds,
    });
    if (validationError) {
      throw mockBadRequest(validationError);
    }
  }

  private programNotFound(): HttpErrorResponse {
    return new HttpErrorResponse({
      status: 404,
      error: { error: 'NOT_FOUND', message: 'Student program not found' },
    });
  }
}
