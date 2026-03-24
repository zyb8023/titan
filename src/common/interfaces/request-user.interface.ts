import type { Request } from 'express';

import type { JwtUser } from './jwt-user.interface';

export interface RequestWithUser extends Request {
  user?: JwtUser;
}
