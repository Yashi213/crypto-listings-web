import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import SuperTokens from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import UserRoles from 'supertokens-node/recipe/userroles';
import { AuthModuleOptions } from './auth-module.options';
import {
  AUTH_MODULE_OPTIONS,
  ST_ROLE_ADMIN,
  ST_ROLE_USER,
  ST_TENANT_ID,
} from './auth.constants';

const pendingDisplayNames = new Map<string, string>();
let superTokensReady = false;

export function takePendingDisplayName(authId: string): string | undefined {
  const value = pendingDisplayNames.get(authId);
  if (value !== undefined) {
    pendingDisplayNames.delete(authId);
  }
  return value;
}

export function initSuperTokens(options: AuthModuleOptions): void {
  if (superTokensReady) {
    return;
  }
  const websiteIsHttps = options.websiteDomain.startsWith('https://');
  SuperTokens.init({
    framework: 'express',
    supertokens: {
      connectionURI: options.connectionUri,
      apiKey: options.apiKey,
    },
    appInfo: {
      appName: options.appName,
      apiDomain: options.apiDomain,
      websiteDomain: options.websiteDomain,
      apiBasePath: options.apiBasePath,
      websiteBasePath: options.websiteBasePath,
    },
    recipeList: [
      EmailPassword.init({
        signUpFeature: {
          formFields: [{ id: 'displayName', optional: true }],
        },
        override: {
          apis: (original) => ({
            ...original,
            signUpPOST: async (input) => {
              if (!original.signUpPOST) {
                throw new Error('signUpPOST недоступен');
              }
              const response = await original.signUpPOST(input);
              if (response.status === 'OK') {
                const raw = input.formFields.find(
                  (field) => field.id === 'displayName',
                )?.value;
                if (typeof raw === 'string' && raw.trim()) {
                  pendingDisplayNames.set(response.user.id, raw.trim());
                }
              }
              return response;
            },
          }),
        },
      }),
      Session.init({
        cookieSameSite: 'lax',
        cookieSecure: websiteIsHttps,
        antiCsrf: 'NONE',
      }),
      UserRoles.init(),
    ],
  });
  superTokensReady = true;
  new Logger('SuperTokens').log(
    `core=${options.connectionUri}, api=${options.apiDomain}`,
  );
}

@Injectable()
export class SuperTokensInitService {
  private readonly logger = new Logger(SuperTokensInitService.name);

  constructor(
    @Inject(AUTH_MODULE_OPTIONS) private readonly options: AuthModuleOptions,
  ) {}

  isAdminEmail(email: string): boolean {
    return this.options.adminEmails.includes(email.trim().toLowerCase());
  }

  async ensureSuperTokensRoles(authId: string, role: UserRole): Promise<void> {
    try {
      await UserRoles.createNewRoleOrAddPermissions(ST_ROLE_USER, []);
      await UserRoles.createNewRoleOrAddPermissions(ST_ROLE_ADMIN, []);
      const target = role === UserRole.ADMIN ? ST_ROLE_ADMIN : ST_ROLE_USER;
      const other = role === UserRole.ADMIN ? ST_ROLE_USER : ST_ROLE_ADMIN;
      try {
        await UserRoles.removeUserRole(ST_TENANT_ID, authId, other);
      } catch {
        // роли ещё не было
      }
      await UserRoles.addRoleToUser(ST_TENANT_ID, authId, target);
    } catch (error) {
      this.logger.warn(
        `Не удалось синхронизировать роль SuperTokens для ${authId}: ${
          error instanceof Error ? error.message : String(error)
        }. Авторизация продолжит использовать роль из БД.`,
      );
    }
  }
}
