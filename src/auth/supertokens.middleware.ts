import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { middleware } from 'supertokens-node/framework/express';

/**
 * Проверка cookie SuperTokens и обработка /auth/* (signin, signup, session).
 */
@Injectable()
export class SuperTokensMiddleware implements NestMiddleware {
  private handler?: ReturnType<typeof middleware>;

  use(req: Request, res: Response, next: NextFunction) {
    if (!this.handler) {
      this.handler = middleware();
    }
    return this.handler(req, res, next);
  }
}
