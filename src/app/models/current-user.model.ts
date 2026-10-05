import { RoleType } from './role-type.model';

export interface CurrentUser {
  id: number;
  email: string;
  role: RoleType;
  graduateProgramId: number | null;
}
