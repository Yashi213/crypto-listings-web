import { UserRole } from '@prisma/client';
import type { SessionContainer } from 'supertokens-node/recipe/session';
import type { AuthUser } from '../auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      currentUser?: AuthUser;
      stSession?: SessionContainer;
    }
  }
}

export {};
