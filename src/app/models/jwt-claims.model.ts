import { RoleType } from './role-type.model';

export interface JwtClaims {
  sub: string;
  role: RoleType;
  graduateProgramId?: number | null;
  exp?: number;
  iat?: number;
}
