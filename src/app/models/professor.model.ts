export type ProfessorType = 'INTERNO' | 'EXTERNO';

export interface RegisterProfessorRequest {
  professorType: ProfessorType;
  employeeNumber?: string | null;
  email: string;
  graduateProgramId: number;
  firstName: string;
  firstLastName: string;
  secondLastName?: string;
  phone: string;
  phoneExtension?: string;
  commissionMember: boolean;
  /** ISO date (YYYY-MM-DD), optional. */
  nextSabbaticalStart?: string;
  /** ISO date (YYYY-MM-DD), optional. */
  nextSabbaticalEnd?: string;
}

export interface ProfessorCatalogItem extends RegisterProfessorRequest {
  id: number;
  userId: number;
  active: boolean;
}

export type ProfessorDetailResponse = ProfessorCatalogItem;

export type UpdateProfessorRequest = Omit<RegisterProfessorRequest, 'graduateProgramId'>;

export interface RegisterProfessorResponse extends ProfessorCatalogItem {
  generatedPassword: string;
}

export interface ProfessorCatalogQuery {
  page: number;
  size: number;
  search?: string;
  active?: boolean;
}
