export interface RegisterProfessorRequest {
  employeeNumber: string;
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
  nextSabbaticalEnd?: string;
}

export interface ProfessorCatalogItem extends RegisterProfessorRequest {
  id: number;
  userId: number;
  active: boolean;
}

export interface RegisterProfessorResponse extends ProfessorCatalogItem {
  generatedPassword: string;
}

export interface ProfessorCatalogQuery {
  page: number;
  size: number;
  search?: string;
  active?: boolean;
}
