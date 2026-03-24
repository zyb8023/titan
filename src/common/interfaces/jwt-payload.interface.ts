import type { UserRole } from '../enums/user-role.enum';

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
  tokenType: 'access' | 'refresh';
}
