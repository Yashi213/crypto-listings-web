import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { setPaginationLinkHeader } from '../common/pagination/set-pagination-link-header';
import { PAGINATED_COLLECTION_RESPONSE_HEADERS } from '../common/swagger/pagination-api.decorator';
import { ApiErrorResponseDto } from '../common/swagger/error-response.dto';
import { CreateFeedbackApiDto } from './dto/create-feedback-api.dto';
import { FeedbackResponseDto } from './dto/feedback-response.dto';
import { FeedbackService } from './feedback.service';

@ApiTags('Отзывы')
@ApiExtraModels(ApiErrorResponseDto, FeedbackResponseDto, CreateFeedbackApiDto)
@Controller('api/feedback')
export class FeedbackApiController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  @ApiOperation({ summary: 'Список отзывов (пагинация)' })
  @ApiOkResponse({
    type: FeedbackResponseDto,
    isArray: true,
    headers: PAGINATED_COLLECTION_RESPONSE_HEADERS,
  })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  async findAll(
    @Query() q: PaginationQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { items, total } = await this.feedbackService.findAllPaginated(
      q.page,
      q.limit,
    );
    setPaginationLinkHeader(req, res, q.page, q.limit, total);
    return items;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать отзыв (JSON API)' })
  @ApiCreatedResponse({ type: FeedbackResponseDto })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description:
      'Ошибка валидации DTO или бизнес-правил (сообщение, рейтинг, ФИО/email)',
  })
  create(@Body() dto: CreateFeedbackApiDto) {
    return this.feedbackService.create({
      message: dto.message,
      rating:
        dto.rating !== undefined && dto.rating !== null
          ? String(dto.rating)
          : undefined,
      displayName: dto.displayName,
      email: dto.email,
    });
  }
}
