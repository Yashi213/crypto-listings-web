import { UserRole } from '@prisma/client';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
};

export type RequestWithUser = {
  currentUser?: AuthUser;
};
