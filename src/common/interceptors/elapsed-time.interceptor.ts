import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request, Response } from 'express';
import { Observable, isObservable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export const ELAPSED_TIME_HEADER = 'X-Elapsed-Time';

@Injectable()
export class ElapsedTimeInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ElapsedTimeInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Вложенное поле GraphQL — кусок того же запроса, отдельно не меряем.
    if (this.isNestedGraphqlField(context)) {
      return next.handle();
    }

    const started = performance.now();
    const { req, res } = this.getReqRes(context);

    const finish = () => {
      const elapsedMs = Math.round(performance.now() - started);
      const url = req?.originalUrl ?? req?.url ?? '';
      this.logger.log(`${req?.method ?? context.getType()} ${url} — ${elapsedMs} мс`);
      if (res && !res.headersSent) {
        res.setHeader(ELAPSED_TIME_HEADER, `${elapsedMs}ms`);
      }
      return elapsedMs;
    };

    return next.handle().pipe(
      map((data) => {
        const elapsedMs = finish();
        if (!this.isHtmlPage(context, req, data)) {
          return data;
        }
        return { ...(data as object), serverElapsedMs: elapsedMs };
      }),
      tap({ error: () => finish() }),
    );
  }

  private isNestedGraphqlField(context: ExecutionContext): boolean {
    if (context.getType<string>() !== 'graphql') {
      return false;
    }
    const info = GqlExecutionContext.create(context).getInfo<{
      path?: { prev?: unknown };
    }>();
    return Boolean(info?.path?.prev);
  }

  private getReqRes(context: ExecutionContext): {
    req?: Request;
    res?: Response;
  } {
    if (context.getType<string>() === 'graphql') {
      const ctx = GqlExecutionContext.create(context).getContext<{
        req?: Request;
        res?: Response;
      }>();
      return { req: ctx.req, res: ctx.res ?? ctx.req?.res };
    }
    const http = context.switchToHttp();
    return {
      req: http.getRequest<Request>(),
      res: http.getResponse<Response>(),
    };
  }

  private isHtmlPage(
    context: ExecutionContext,
    req: Request | undefined,
    data: unknown,
  ): boolean {
    if (context.getType<string>() === 'graphql') return false;
    if (data == null || typeof data !== 'object' || Array.isArray(data)) {
      return false;
    }
    if (isObservable(data) || data instanceof StreamableFile) return false;
    const path = req?.path || req?.url?.split('?')[0] || '';
    if (path.startsWith('/api/') || path.startsWith('/graphql')) return false;
    if (path.endsWith('/stream')) return false;
    return true;
  }
}
