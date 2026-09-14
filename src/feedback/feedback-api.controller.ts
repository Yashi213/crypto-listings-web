import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { setPaginationLinkHeader } from '../common/pagination/set-pagination-link-header';
import { PAGINATED_COLLECTION_RESPONSE_HEADERS } from '../common/swagger/pagination-api.decorator';
import {
  ApiErrorResponseDto,
  ApiNotFoundErrorDto,
} from '../common/swagger/error-response.dto';
import { CreateFeedbackApiDto } from './dto/create-feedback-api.dto';
import { FeedbackResponseDto } from './dto/feedback-response.dto';
import { UpdateFeedbackApiDto } from './dto/update-feedback-api.dto';
import { CacheControl } from '../common/decorators/cache-control.decorator';
import { FeedbackService } from './feedback.service';

@ApiTags('Отзывы')
@ApiExtraModels(
  ApiErrorResponseDto,
  ApiNotFoundErrorDto,
  FeedbackResponseDto,
  CreateFeedbackApiDto,
  UpdateFeedbackApiDto,
)
@Controller('api/feedback')
export class FeedbackApiController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  @CacheControl()
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

  @Get(':id')
  @CacheControl()
  @ApiOperation({ summary: 'Один отзыв по id' })
  @ApiOkResponse({ type: FeedbackResponseDto })
  @ApiNotFoundResponse({ type: ApiNotFoundErrorDto })
  findOne(@Param('id') id: string) {
    return this.feedbackService.findOne(id);
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

  @Patch(':id')
  @ApiOperation({ summary: 'Частично обновить отзыв' })
  @ApiOkResponse({ type: FeedbackResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiNotFoundErrorDto })
  update(@Param('id') id: string, @Body() dto: UpdateFeedbackApiDto) {
    return this.feedbackService.update(id, {
      message: dto.message,
      rating: dto.rating,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить отзыв' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ApiNotFoundErrorDto })
  async remove(@Param('id') id: string) {
    await this.feedbackService.remove(id);
  }
}
