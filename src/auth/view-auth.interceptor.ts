import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserRole } from '@prisma/client';

/**
 * Подкладывает isAuth / userName / isAdmin во все Pug-рендеры.
 */
@Injectable()
export class ViewAuthInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType<string>() !== 'http') {
      return next.handle() as Observable<unknown>;
    }
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.currentUser;
    const sessionView = {
      isAuth: Boolean(user),
      userName: user?.displayName ?? '',
      isAdmin: user?.role === UserRole.ADMIN,
    };

    const response$ = next.handle() as Observable<unknown>;
    return response$.pipe(
      map((data: unknown): unknown => {
        if (
          data == null ||
          typeof data !== 'object' ||
          Array.isArray(data) ||
          !('pageTitle' in data)
        ) {
          return data;
        }
        return { ...data, ...sessionView };
      }),
    );
  }
}
