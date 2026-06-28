import type { ProgramType } from './student.model';

export type ProgramStatus = 'ACTIVO' | 'BAJA' | 'EGRESADO';

export interface ProfessorReference {
  id: number;
  firstName: string;
  firstLastName: string;
  secondLastName?: string;
}

export interface StudentProgramSummary {
  id: number;
  programType: ProgramType;
  enrollmentId: string;
  status: ProgramStatus;
  tutorId?: number;
  hasTutor: boolean;
}

export interface StudentProgramResponse {
  id: number;
  studentId: number;
  graduateProgramId: number;
  enrollmentId: string;
  programType: ProgramType;
  admissionDate: string;
  graduationDate?: string;
  lineOfKnowledge?: string;
  researchArea?: string;
  status: ProgramStatus;
  withdrawalReason?: string;
  tutorId?: number;
  tutor?: ProfessorReference;
  advisorIds: number[];
  advisors: ProfessorReference[];
}

export interface UpdateStudentProgramRequest {
  admissionDate: string;
  graduationDate?: string;
  lineOfKnowledge?: string;
  researchArea?: string;
  status: ProgramStatus;
  withdrawalReason?: string;
  tutorId?: number | null;
  advisorIds: number[];
}
