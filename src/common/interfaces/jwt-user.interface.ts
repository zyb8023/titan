import type { UserRole } from '../enums/user-role.enum';

export interface JwtUser {
  userId: number;
  email: string;
  role: UserRole;
  tokenType: 'access' | 'refresh';
  refreshToken?: string;
}
