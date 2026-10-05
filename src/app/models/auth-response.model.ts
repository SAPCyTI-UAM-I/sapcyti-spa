import { RoleType } from './role-type.model';

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  role: RoleType;
}
