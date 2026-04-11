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
  ApiConflictResponse,
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
import { ApiErrorResponseDto } from '../common/swagger/error-response.dto';
import { ListingResponseDto } from '../listings/dto/listing-response.dto';
import { MarketNewsResponseDto } from '../market-news/dto/market-news-response.dto';
import { CreateExchangeDto } from './dto/create-exchange.dto';
import { ExchangeResponseDto } from './dto/exchange-response.dto';
import { UpdateExchangeDto } from './dto/update-exchange.dto';
import { ExchangesService } from './exchanges.service';

@ApiTags('Биржи')
@ApiExtraModels(
  ApiErrorResponseDto,
  DeleteOkResponseDto,
  ExchangeResponseDto,
  ListingResponseDto,
  MarketNewsResponseDto,
)
@Controller('api/exchanges')
export class ExchangesApiController {
  constructor(private readonly exchangesService: ExchangesService) {}

  @Get()
  @ApiOperation({
    summary: 'Список бирж',
    description:
      'Постраничная выдача. См. заголовки `Link` и `X-Total-Count`.',
  })
  @ApiOkResponse({
    type: ExchangeResponseDto,
    isArray: true,
    headers: PAGINATED_COLLECTION_RESPONSE_HEADERS,
  })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'Некорректные query-параметры пагинации',
  })
  async findAll(
    @Query() q: PaginationQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { items, total } = await this.exchangesService.findAllPaginated(
      q.page,
      q.limit,
    );
    setPaginationLinkHeader(req, res, q.page, q.limit, total);
    return items;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать биржу' })
  @ApiCreatedResponse({ type: ExchangeResponseDto })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'Ошибка валидации тела запроса',
  })
  @ApiConflictResponse({
    type: ApiErrorResponseDto,
    description: 'Биржа с таким названием уже существует (P2002 / Conflict)',
  })
  create(@Body() dto: CreateExchangeDto) {
    return this.exchangesService.create(dto);
  }

  @Get(':id/listings/:listingId')
  @ApiOperation({ summary: 'Один листинг биржи по id' })
  @ApiParam({ name: 'id', description: 'ID биржи' })
  @ApiParam({ name: 'listingId', description: 'ID листинга' })
  @ApiOkResponse({ type: ListingResponseDto })
  @ApiNotFoundResponse({
    type: ApiErrorResponseDto,
    description: 'Биржа или листинг не найдены / листинг не принадлежит бирже',
  })
  findListingInExchange(
    @Param('id') exchangeId: string,
    @Param('listingId') listingId: string,
  ) {
    return this.exchangesService.findListingInExchange(exchangeId, listingId);
  }

  @Get(':id/listings')
  @ApiOperation({ summary: 'Листинги биржи (пагинация)' })
  @ApiParam({ name: 'id', description: 'ID биржи' })
  @ApiOkResponse({
    type: ListingResponseDto,
    isArray: true,
    headers: PAGINATED_COLLECTION_RESPONSE_HEADERS,
  })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({
    type: ApiErrorResponseDto,
    description: 'Биржа не найдена',
  })
  async listingsByExchange(
    @Param('id') exchangeId: string,
    @Query() q: PaginationQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { items, total } =
      await this.exchangesService.findListingsByExchangePaginated(
        exchangeId,
        q.page,
        q.limit,
      );
    setPaginationLinkHeader(req, res, q.page, q.limit, total);
    return items;
  }

  @Get(':id/market-news/:newsId')
  @ApiOperation({ summary: 'Одна новость рынка биржи' })
  @ApiParam({ name: 'id', description: 'ID биржи' })
  @ApiParam({ name: 'newsId', description: 'ID новости' })
  @ApiOkResponse({ type: MarketNewsResponseDto })
  @ApiNotFoundResponse({
    type: ApiErrorResponseDto,
    description: 'Биржа или новость не найдены / новость не принадлежит бирже',
  })
  findNewsInExchange(
    @Param('id') exchangeId: string,
    @Param('newsId') newsId: string,
  ) {
    return this.exchangesService.findMarketNewsInExchange(exchangeId, newsId);
  }

  @Get(':id/market-news')
  @ApiOperation({ summary: 'Новости рынка биржи (пагинация)' })
  @ApiParam({ name: 'id', description: 'ID биржи' })
  @ApiOkResponse({
    type: MarketNewsResponseDto,
    isArray: true,
    headers: PAGINATED_COLLECTION_RESPONSE_HEADERS,
  })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({
    type: ApiErrorResponseDto,
    description: 'Биржа не найдена',
  })
  async marketNewsByExchange(
    @Param('id') exchangeId: string,
    @Query() q: PaginationQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { items, total } =
      await this.exchangesService.findMarketNewsByExchangePaginated(
        exchangeId,
        q.page,
        q.limit,
      );
    setPaginationLinkHeader(req, res, q.page, q.limit, total);
    return items;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Биржа по id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: ExchangeResponseDto })
  @ApiNotFoundResponse({
    type: ApiErrorResponseDto,
    description: 'Биржа не найдена',
  })
  findOne(@Param('id') id: string) {
    return this.exchangesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Частично обновить биржу' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: ExchangeResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  @ApiConflictResponse({
    type: ApiErrorResponseDto,
    description: 'Конфликт уникальности названия',
  })
  update(@Param('id') id: string, @Body() dto: UpdateExchangeDto) {
    return this.exchangesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить биржу' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: DeleteOkResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'Ошибка БД при удалении (например, ограничения FK)',
  })
  async remove(@Param('id') id: string) {
    await this.exchangesService.remove(id);
    return { ok: true };
  }
}
