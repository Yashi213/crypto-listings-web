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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { setPaginationLinkHeader } from '../common/pagination/set-pagination-link-header';
import { PAGINATED_COLLECTION_RESPONSE_HEADERS } from '../common/swagger/pagination-api.decorator';
import { DeleteOkResponseDto } from '../common/swagger/delete-ok-response.dto';
import {
  ApiErrorResponseDto,
  ApiNotFoundErrorDto,
} from '../common/swagger/error-response.dto';
import { CreateMarketNewDto } from './dto/create-market-new.dto';
import { MarketNewsResponseDto } from './dto/market-news-response.dto';
import { UpdateMarketNewDto } from './dto/update-market-new.dto';
import { MarketNewsService } from './market-news.service';
import { CacheControl } from '../common/decorators/cache-control.decorator';
import { AdminOnly } from '../auth/roles.decorator';
import { PublicAccess } from '../auth/public-access.decorator';
import { MarketNewsSseService } from './market-news-sse.service';

@ApiTags('Новости рынка')
@PublicAccess()
@ApiExtraModels(
  ApiErrorResponseDto,
  ApiNotFoundErrorDto,
  DeleteOkResponseDto,
  MarketNewsResponseDto,
)
@Controller('api/market-news')
export class MarketNewsApiController {
  constructor(
    private readonly marketNewsService: MarketNewsService,
    private readonly marketNewsSseService: MarketNewsSseService,
  ) {}

  @Get()
  @CacheControl()
  @ApiOperation({ summary: 'Список новостей (пагинация)' })
  @ApiOkResponse({
    type: MarketNewsResponseDto,
    isArray: true,
    headers: PAGINATED_COLLECTION_RESPONSE_HEADERS,
  })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  async findAll(
    @Query() q: PaginationQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { items, total } = await this.marketNewsService.findAllPaginated(
      q.page,
      q.limit,
    );
    setPaginationLinkHeader(req, res, q.page, q.limit, total);
    return items;
  }

  @AdminOnly()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать новость' })
  @ApiCreatedResponse({ type: MarketNewsResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({
    type: ApiNotFoundErrorDto,
    description: 'Биржа (exchangeId) не найдена',
  })
  async create(@Body() dto: CreateMarketNewDto) {
    const created = await this.marketNewsService.create(dto);
    this.marketNewsSseService.notifyCreated(created);
    return created;
  }

  @Get(':id')
  @CacheControl()
  @ApiOperation({ summary: 'Новость по id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: MarketNewsResponseDto })
  @ApiNotFoundResponse({ type: ApiNotFoundErrorDto })
  findOne(@Param('id') id: string) {
    return this.marketNewsService.findOne(id);
  }

  @AdminOnly()
  @Patch(':id')
  @ApiOperation({ summary: 'Частично обновить новость' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: MarketNewsResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({
    type: ApiNotFoundErrorDto,
    description: 'Новость или связанная биржа не найдены',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateMarketNewDto) {
    const updated = await this.marketNewsService.update(id, dto);
    return updated;
  }

  @AdminOnly()
  @Delete(':id')
  @ApiOperation({ summary: 'Удалить новость' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: DeleteOkResponseDto })
  @ApiNotFoundResponse({ type: ApiNotFoundErrorDto })
  async remove(@Param('id') id: string) {
    await this.marketNewsService.remove(id);
    return { ok: true };
  }
}
