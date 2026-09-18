import { applyDecorators, SetMetadata } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  REQUIRE_AUTH_KEY,
  ROLES_KEY,
  SWAGGER_COOKIE_AUTH,
} from './auth.constants';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/** Нужна сессия; в Swagger появится замочек (cookie SuperTokens). */
export const AuthRequired = () =>
  applyDecorators(
    SetMetadata(REQUIRE_AUTH_KEY, true),
    ApiCookieAuth(SWAGGER_COOKIE_AUTH),
    ApiUnauthorizedResponse({ description: 'Нужна аутентификация' }),
  );

/** Только администратор + замочек в Swagger. */
export const AdminOnly = () =>
  applyDecorators(
    Roles(UserRole.ADMIN),
    ApiCookieAuth(SWAGGER_COOKIE_AUTH),
    ApiUnauthorizedResponse({ description: 'Нужна аутентификация' }),
    ApiForbiddenResponse({
      description: 'Недостаточно прав: нужна роль администратора',
    }),
  );
