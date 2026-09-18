import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Render,
  Res,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminOnly, AuthRequired } from '../auth/roles.decorator';
import type { AuthUser } from '../auth/auth.types';
import { viewAuth } from '../common/view-session';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { FeedbackService } from './feedback.service';

/**
 * MVC: POST /feedbacks — любой вошедший пользователь.
 * Список, правка и удаление — только администратор.
 */
@ApiExcludeController()
@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  private nav(auth?: string, user?: string) {
    return {
      ...viewAuth(auth, user),
      pageTitle: 'Отзывы — Listing Tracker',
      activeListing: false,
      activeFeedback: false,
      activePrivacy: false,
      activeTerms: false,
      activeExchanges: false,
      activeMarketNews: false,
      activeFeedbackAdmin: true,
      activeListingsCrud: false,
      activeAssetsCrud: false,
    };
  }

  @AdminOnly()
  @Get()
  @Render('feedbacks/index')
  async index(@Query('auth') auth?: string, @Query('user') user?: string) {
    const items = await this.feedbackService.findAllForAdmin();
    return { ...this.nav(auth, user), items };
  }

  @AdminOnly()
  @Get(':id/edit')
  @Render('feedbacks/edit')
  async editPage(
    @Param('id') id: string,
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const feedback = await this.feedbackService.findOne(id);
    return { ...this.nav(auth, user), feedback };
  }

  @AdminOnly()
  @Get(':id')
  @Render('feedbacks/show')
  async show(
    @Param('id') id: string,
    @Query('auth') auth?: string,
    @Query('user') user?: string,
  ) {
    const feedback = await this.feedbackService.findOne(id);
    return { ...this.nav(auth, user), feedback };
  }

  /**
   * Создание отзыва с публичной страницы /feedback. Поле next — редирект после сохранения.
   */
  @AuthRequired()
  @Post()
  async create(
    @Body() body: CreateFeedbackDto & { next?: string },
    @CurrentUser() actor: AuthUser,
    @Res() res: Response,
  ) {
    const { next, ...dto } = body;
    await this.feedbackService.create(dto, actor);
    const raw = next != null ? String(next).trim() : '';
    const url =
      raw.startsWith('/') && !raw.startsWith('//') ? raw : '/feedback?saved=1';
    return res.redirect(HttpStatus.FOUND, url);
  }

  @AdminOnly()
  @Post(':id/update')
  async updateForm(
    @Param('id') id: string,
    @Body() body: UpdateFeedbackDto,
    @Res() res: Response,
  ) {
    await this.feedbackService.update(id, {
      message: body.message,
      rating: body.rating,
    });
    return res.redirect(HttpStatus.FOUND, `/feedbacks/${id}`);
  }

  @AdminOnly()
  @Post(':id/delete')
  async removeForm(@Param('id') id: string, @Res() res: Response) {
    await this.feedbackService.remove(id);
    return res.redirect(HttpStatus.FOUND, '/feedbacks');
  }
}
