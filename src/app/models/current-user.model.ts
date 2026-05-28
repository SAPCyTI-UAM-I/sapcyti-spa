export interface CurrentUser {
  id: number;
  email: string;
  role: string;
  graduateProgramId?: number;
}
