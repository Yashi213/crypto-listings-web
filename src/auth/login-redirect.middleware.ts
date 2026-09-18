import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/**
 * Если HTML-ресурс только для авторизованных, а сессии нет — на форму входа.
 * Публичные страницы (каталоги, карточки) пропускаются.
 */
@Injectable()
export class LoginRedirectMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.currentUser) {
      next();
      return;
    }
    if (this.shouldPassAnonymous(req)) {
      next();
      return;
    }
    const returnTo =
      req.path === '/feedbacks' && req.method.toUpperCase() === 'POST'
        ? '/feedback'
        : req.originalUrl || req.url || '/';
    const nextUrl = encodeURIComponent(returnTo);
    res.redirect(302, `/login?next=${nextUrl}`);
  }

  private shouldPassAnonymous(req: Request): boolean {
    const method = req.method.toUpperCase();
    if (method === 'OPTIONS') {
      return true;
    }

    const path = (req.path || req.url.split('?')[0]).replace(/\/+$/, '') || '/';

    if (path === '/login' || path === '/register' || path === '/logout') {
      return true;
    }
    if (
      path.startsWith('/auth') ||
      path.startsWith('/api') ||
      path.startsWith('/graphql')
    ) {
      return true;
    }

    const accept = req.get('accept') || '';
    if (accept.includes('application/json') && !accept.includes('text/html')) {
      return true;
    }

    if (method !== 'GET' && method !== 'HEAD') {
      return false;
    }

    if (path.endsWith('/stream')) {
      return true;
    }
    if (path.endsWith('/add') || path.endsWith('/edit')) {
      return false;
    }

    return /^(?:\/listings|\/assets|\/exchanges|\/market-news)(?:\/[^/]+)?$/.test(
      path,
    );
  }
}
