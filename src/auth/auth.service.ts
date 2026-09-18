import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import SuperTokens from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import type { SessionContainer } from 'supertokens-node/recipe/session';
import { PrismaService } from '../prisma/prisma.service';
import {
  SuperTokensInitService,
  takePendingDisplayName,
} from './supertokens-init.service';
import type { AuthUser } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly st: SuperTokensInitService,
  ) {}

  async ensureLocalUser(
    authId: string,
    displayNameHint?: string,
  ): Promise<AuthUser> {
    const stUser = await SuperTokens.getUser(authId);
    if (!stUser?.emails[0]) {
      throw new UnauthorizedException(
        'Пользователь текущей сессии не найден в SuperTokens',
      );
    }
    const email = stUser.emails[0].toLowerCase();
    const fallbackName = email.split('@')[0] || 'Пользователь';
    const explicitName =
      displayNameHint?.trim() || takePendingDisplayName(authId);
    const displayName = explicitName || fallbackName;
    const asAdmin = this.st.isAdminEmail(email);

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ authId }, { email }] },
    });

    let needRoleSync = false;
    if (!user) {
      try {
        user = await this.prisma.user.create({
          data: {
            authId,
            email,
            displayName,
            role: asAdmin ? UserRole.ADMIN : UserRole.USER,
          },
        });
      } catch (error) {
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== 'P2002'
        ) {
          throw error;
        }
        user = await this.prisma.user.findFirst({
          where: { OR: [{ authId }, { email }] },
        });
        if (!user) {
          throw error;
        }
      }
      needRoleSync = true;
    }

    if (user) {
      const nextRole = asAdmin ? UserRole.ADMIN : UserRole.USER;
      const nextName =
        explicitName && explicitName.length >= 2
          ? explicitName
          : user.displayName;
      const needUpdate =
        user.authId !== authId ||
        user.role !== nextRole ||
        user.email !== email ||
        user.displayName !== nextName;
      if (needUpdate) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            authId,
            email,
            role: nextRole,
            displayName: nextName,
          },
        });
        needRoleSync = true;
      }
    }

    if (needRoleSync) {
      await this.st.ensureSuperTokensRoles(authId, user.role);
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    displayName: string;
    role: UserRole;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }

  async updateDisplayName(
    userId: string,
    displayName: string,
  ): Promise<AuthUser> {
    const name = displayName.trim();
    if (name.length < 2) {
      throw new BadRequestException('Имя: минимум 2 символа');
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { displayName: name },
    });
    return this.toAuthUser(user);
  }

  async updatePassword(
    session: SessionContainer,
    password: string,
  ): Promise<void> {
    if (!password || password.length < 8) {
      throw new BadRequestException('Пароль: минимум 8 символов');
    }
    const result = await EmailPassword.updateEmailOrPassword({
      recipeUserId: session.getRecipeUserId(),
      password,
    });
    if (result.status === 'PASSWORD_POLICY_VIOLATED_ERROR') {
      throw new BadRequestException(
        result.failureReason || 'Пароль не соответствует политике SuperTokens',
      );
    }
    if (result.status !== 'OK') {
      throw new BadRequestException('Не удалось сменить пароль');
    }
  }
}
