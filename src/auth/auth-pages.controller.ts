import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Render,
  Req,
  Res,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import Session from 'supertokens-node/recipe/session';
import { AuthService } from './auth.service';
import { AuthRequired } from './roles.decorator';
import { PublicAccess } from './public-access.decorator';

@ApiExcludeController()
@Controller()
export class AuthPagesController {
  constructor(private readonly authService: AuthService) {}

  @PublicAccess()
  @Get('login')
  @Render('auth/login')
  loginPage(@Query('next') next?: string, @Query('error') error?: string) {
    return this.authPage('Вход — Listing Tracker', next, error);
  }

  @PublicAccess()
  @Get('register')
  @Render('auth/register')
  registerPage(@Query('next') next?: string, @Query('error') error?: string) {
    return this.authPage('Регистрация — Listing Tracker', next, error);
  }

  @AuthRequired()
  @Get('account')
  @Render('auth/account')
  accountPage(
    @Req() req: Request,
    @Query('saved') saved?: string,
    @Query('error') error?: string,
  ) {
    return {
      pageTitle: 'Аккаунт — Listing Tracker',
      account: req.currentUser,
      saved: saved === '1',
      error,
      ...this.navFlags(),
    };
  }

  @AuthRequired()
  @Post('account')
  async updateAccount(
    @Req() req: Request,
    @Res() res: Response,
    @Body()
    body: { displayName?: string; password?: string; passwordRepeat?: string },
  ) {
    const user = req.currentUser;
    const session = req.stSession;
    if (!user || !session) {
      return res.redirect(302, '/login?next=/account');
    }
    try {
      const displayName = body.displayName?.trim();
      if (displayName) {
        await this.authService.updateDisplayName(user.id, displayName);
      }
      const password = body.password ?? '';
      const passwordRepeat = body.passwordRepeat ?? '';
      if (password || passwordRepeat) {
        if (password !== passwordRepeat) {
          throw new Error('Пароли не совпадают');
        }
        await this.authService.updatePassword(session, password);
      }
      return res.redirect(302, '/account?saved=1');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось сохранить настройки';
      return res.redirect(302, `/account?error=${encodeURIComponent(message)}`);
    }
  }

  @PublicAccess()
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      const session = await Session.getSession(req, res, {
        sessionRequired: false,
      });
      if (session) {
        await session.revokeSession();
      }
    } catch {
      // уже не в сессии
    }
    return res.redirect(302, '/');
  }

  private authPage(pageTitle: string, next?: string, error?: string) {
    return {
      pageTitle,
      next: next || '/',
      error,
      ...this.navFlags(),
    };
  }

  private navFlags() {
    return {
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
}
