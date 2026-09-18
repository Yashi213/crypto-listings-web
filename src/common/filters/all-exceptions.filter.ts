import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import SuperTokens from 'supertokens-node';
import { errorHandler } from 'supertokens-node/framework/express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): unknown {
    if (host.getType<string>() === 'graphql') {
      const req = GqlArgumentsHost.create(host).getContext<{
        req?: Request;
      }>()?.req;
      if (
        exception instanceof HttpException &&
        exception.getStatus() === 403 &&
        !req?.currentUser
      ) {
        return new UnauthorizedException('Нужна аутентификация');
      }
      return exception;
    }

    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (SuperTokens.Error.isErrorFromSuperTokens(exception)) {
      void errorHandler()(exception, req, res, () => {
        this.send(req, res, HttpStatus.UNAUTHORIZED, 'Ошибка аутентификации');
      });
      return;
    }

    if (exception instanceof HttpException) {
      const originalStatus = exception.getStatus();
      const unauthenticated = originalStatus === 403 && !req.currentUser;
      const status = unauthenticated ? HttpStatus.UNAUTHORIZED : originalStatus;
      const body = exception.getResponse() as string | Record<string, unknown>;
      const message = unauthenticated
        ? 'Нужна аутентификация'
        : this.normalizeMessage(body);
      this.send(req, res, status, message);
      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = this.mapPrismaError(exception);
      this.send(req, res, mapped.status, mapped.message, exception.code);
      return;
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      this.send(
        req,
        res,
        HttpStatus.BAD_REQUEST,
        'Некорректный запрос к базе данных',
      );
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );
    this.send(
      req,
      res,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Внутренняя ошибка сервера',
    );
  }

  /** JSON для API, SSE и клиентов с Accept: application/json; иначе HTML. */
  private wantsJson(req: Request): boolean {
    const path = req.path || req.url.split('?')[0];
    if (path.startsWith('/api/')) return true;
    if (path.startsWith('/graphql')) return true;
    if (path.endsWith('/stream')) return true;
    const accept = req.get('accept') || '';
    if (accept.includes('text/event-stream')) return true;
    if (accept.includes('application/json') && !accept.includes('text/html')) {
      return true;
    }
    return false;
  }

  private normalizeMessage(body: string | Record<string, unknown>): string {
    if (typeof body === 'string') return body;
    const msg = body.message;
    if (Array.isArray(msg)) return msg.map(String).join('; ');
    if (typeof msg === 'string') return msg;
    return 'Произошла ошибка';
  }

  private mvcLocals(req: Request, status: number, message: string) {
    const sessionUser = req.currentUser;
    return {
      isAuth: Boolean(sessionUser),
      userName: sessionUser?.displayName ?? '',
      isAdmin: sessionUser?.role === 'ADMIN',
      pageTitle: `Ошибка ${status} — Listing Tracker`,
      errorStatus: status,
      errorMessage: message,
      activeListing: false,
      activeFeedback: false,
      activePrivacy: false,
      activeTerms: false,
      activeExchanges: false,
      activeMarketNews: false,
      activeFeedbackAdmin: false,
      activeListingsCrud: false,
      activeAssetsCrud: false,
    };
  }

  private send(
    req: Request,
    res: Response,
    status: number,
    message: string,
    code?: string,
  ): void {
    if (this.wantsJson(req)) {
      const payload: Record<string, unknown> = {
        statusCode: status,
        message,
        path: req.url,
      };
      if (code !== undefined) payload.code = code;
      res.status(status).json(payload);
      return;
    }

    if (
      !req.currentUser &&
      (status === 401 || status === 403) &&
      (req.method === 'GET' || req.method === 'HEAD') &&
      !req.path.startsWith('/login')
    ) {
      const nextUrl = encodeURIComponent(req.originalUrl || req.url || '/');
      res.redirect(302, `/login?next=${nextUrl}`);
      return;
    }

    if (typeof res.render === 'function') {
      res.status(status).render('error', this.mvcLocals(req, status, message));
      return;
    }

    res.status(status).type('html').send(this.fallbackHtml(status, message));
  }

  private fallbackHtml(status: number, message: string): string {
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Ошибка ${status}</title></head><body><h1>Ошибка ${status}</h1><p>${esc(message)}</p><p><a href="/">На главную</a></p></body></html>`;
  }

  private mapPrismaError(err: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (err.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: 'Запись с такими уникальными полями уже существует',
        };
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND, message: 'Запись не найдена' };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Нарушение ссылки на связанную запись',
        };
      case 'P2014':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Недопустимое изменение связи между записями',
        };
      default:
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Ошибка при обращении к базе данных',
        };
    }
  }
}
