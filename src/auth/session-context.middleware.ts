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
      const session = await Session.getSession(req, res, {
        sessionRequired: false,
      });
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
}
