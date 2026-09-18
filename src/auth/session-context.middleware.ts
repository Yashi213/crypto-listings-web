import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import Session from 'supertokens-node/recipe/session';
import { AuthService } from './auth.service';

/**
 * Аутентификация: проверка cookie SuperTokens и userId → пользователь в БД.
 * Guard дальше только решает, пускать ли к маршруту.
 */
@Injectable()
export class SessionContextMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const session = await this.loadSession(req, res);
      if (!session) {
        next();
        return;
      }
      req.stSession = session;
      req.currentUser = await this.authService.ensureLocalUser(
        session.getUserId(),
      );
      next();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Access JWT живёт коротко. Без фронтового SDK Pug сам refresh не вызывает —
   * тогда getSession кидает TRY_REFRESH_TOKEN и пользователь видит JSON.
   * Здесь обновляем сессию на сервере и продолжаем запрос.
   */
  private async loadSession(req: Request, res: Response) {
    try {
      return await Session.getSession(req, res, { sessionRequired: false });
    } catch (error) {
      if (
        !Session.Error.isErrorFromSuperTokens(error) ||
        error.type !== Session.Error.TRY_REFRESH_TOKEN
      ) {
        throw error;
      }
      try {
        return await Session.refreshSession(req, res);
      } catch {
        return undefined;
      }
    }
  }
}
