export type ProgramType = 'MAESTRIA' | 'DOCTORADO';

export interface RegisterStudentRequest {
  enrollmentId: string;
  email: string;
  graduateProgramId: number;
  firstName: string;
  firstLastName: string;
  secondLastName?: string;
  nationality: string;
  undergraduateDegree: string;
  programType: ProgramType;
  admissionDate: string;
}

export interface StudentCatalogItem extends RegisterStudentRequest {
  id: number;
  userId: number;
  active: boolean;
}

export interface RegisterStudentResponse extends StudentCatalogItem {
  generatedPassword: string;
}

export interface StudentCatalogQuery {
  page: number;
  size: number;
  search?: string;
  programType?: ProgramType;
  active?: boolean;
}
