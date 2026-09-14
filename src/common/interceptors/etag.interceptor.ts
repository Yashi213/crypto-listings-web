import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { createHash } from 'crypto';
import type { Request, Response } from 'express';
import { Observable, isObservable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class EtagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType<string>() === 'graphql') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    if (!this.isApiGet(req)) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        if (!this.canHash(data) || res.headersSent) {
          return data;
        }

        const etag = this.etagOf(data);
        res.setHeader('ETag', etag);

        const clientTag = req.headers['if-none-match'];
        if (typeof clientTag === 'string' && clientTag === etag) {
          res.status(HttpStatus.NOT_MODIFIED);
          return undefined;
        }
        return data;
      }),
    );
  }

  private isApiGet(req: Request): boolean {
    if (req.method !== 'GET') return false;
    const path = req.path || req.url.split('?')[0];
    return path.startsWith('/api/');
  }

  private canHash(data: unknown): boolean {
    if (data == null || isObservable(data) || data instanceof StreamableFile) {
      return false;
    }
    return true;
  }

  private etagOf(data: unknown): string {
    const hash = createHash('sha1')
      .update(JSON.stringify(data))
      .digest('hex');
    return `"${hash}"`;
  }
}
