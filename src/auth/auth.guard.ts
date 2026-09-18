import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import type { Request, Response } from 'express';
import { IS_PUBLIC_KEY, REQUIRE_AUTH_KEY, ROLES_KEY } from './auth.constants';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const { req } = this.getReqRes(context);
    if (!req) {
      return false;
    }

    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requireAuth = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (roles?.length || requireAuth) {
      if (!req.currentUser) {
        return false;
      }
      if (roles?.length && !roles.includes(req.currentUser.role)) {
        return false;
      }
      return true;
    }

    if (this.isAuthApi(req) || this.isOpenHttpPath(req)) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    return Boolean(req.currentUser);
  }

  private isAuthApi(req: Request): boolean {
    const path = req.path || req.url.split('?')[0];
    return path.startsWith('/auth');
  }

  private isOpenHttpPath(req: Request): boolean {
    if (req.method === 'OPTIONS') {
      return true;
    }
    const path = req.path || req.url.split('?')[0];
    if (path.startsWith('/api/docs')) {
      return true;
    }
    if (path === '/graphql' && req.method === 'GET') {
      return true;
    }
    return false;
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
    return {
      req: context.switchToHttp().getRequest<Request>(),
      res: context.switchToHttp().getResponse<Response>(),
    };
  }
}
