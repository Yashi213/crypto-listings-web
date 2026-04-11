import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

/** POST /feedbacks — только приём отзывов с публичной страницы /feedback */
@ApiExcludeController()
@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  /**
   * Создание отзыва. Поле next (опционально) — куда редиректить после сохранения
   * (публичная форма на /feedback передаёт next=/feedback?saved=1).
   */
  @Post()
  async create(
    @Body() body: CreateFeedbackDto & { next?: string },
    @Res() res: Response,
  ) {
    const { next, ...dto } = body;
    await this.feedbackService.create(dto);
    const raw = next != null ? String(next).trim() : '';
    const url =
      raw.startsWith('/') && !raw.startsWith('//')
        ? raw
        : '/feedback?saved=1';
    return res.redirect(HttpStatus.FOUND, url);
  }
}
