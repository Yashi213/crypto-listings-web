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
import {
  ApiConflictErrorDto,
  ApiErrorResponseDto,
  ApiNotFoundErrorDto,
} from '../common/swagger/error-response.dto';
import { AddTradingPairDto } from './dto/add-trading-pair.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListingResponseDto, TradingPairResponseDto } from './dto/listing-response.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingsSseService } from './listings-sse.service';
import { ListingsService } from './listings.service';

@ApiTags('Листинги')
@ApiExtraModels(
  ApiConflictErrorDto,
  ApiErrorResponseDto,
  ApiNotFoundErrorDto,
  DeleteOkResponseDto,
  ListingResponseDto,
  TradingPairResponseDto,
)
@Controller('api/listings')
export class ListingsApiController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly listingsSseService: ListingsSseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Список листингов (пагинация)' })
  @ApiOkResponse({
    type: ListingResponseDto,
    isArray: true,
    headers: PAGINATED_COLLECTION_RESPONSE_HEADERS,
  })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  async findAll(
    @Query() q: PaginationQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { items, total } = await this.listingsService.findAllPaginated(
      q.page,
      q.limit,
    );
    setPaginationLinkHeader(req, res, q.page, q.limit, total);
    return items;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать листинг' })
  @ApiCreatedResponse({ type: ListingResponseDto })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'Валидация или некорректные статус/дата',
  })
  @ApiNotFoundResponse({
    type: ApiNotFoundErrorDto,
    description: 'Биржа или основной актив не найдены',
  })
  async create(@Body() dto: CreateListingDto) {
    const created = await this.listingsService.create(dto);
    this.listingsSseService.notifyCreated(created);
    return created;
  }

  @Get(':id/pairs/:pairId')
  @ApiOperation({ summary: 'Одна торговая пара листинга' })
  @ApiParam({ name: 'id', description: 'ID листинга' })
  @ApiParam({ name: 'pairId', description: 'ID пары' })
  @ApiOkResponse({ type: TradingPairResponseDto })
  @ApiNotFoundResponse({
    type: ApiNotFoundErrorDto,
    description: 'Листинг или пара не найдены / пара не относится к листингу',
  })
  findOnePair(
    @Param('id') listingId: string,
    @Param('pairId') pairId: string,
  ) {
    return this.listingsService.findPairForListing(listingId, pairId);
  }

  @Get(':id/pairs')
  @ApiOperation({ summary: 'Торговые пары листинга (пагинация)' })
  @ApiParam({ name: 'id', description: 'ID листинга' })
  @ApiOkResponse({
    type: TradingPairResponseDto,
    isArray: true,
    headers: PAGINATED_COLLECTION_RESPONSE_HEADERS,
  })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiNotFoundErrorDto })
  async findPairs(
    @Param('id') listingId: string,
    @Query() q: PaginationQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { items, total } = await this.listingsService.findPairsPaginated(
      listingId,
      q.page,
      q.limit,
    );
    setPaginationLinkHeader(req, res, q.page, q.limit, total);
    return items;
  }

  @Post(':id/pairs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Добавить торговую пару к листингу' })
  @ApiParam({ name: 'id', description: 'ID листинга' })
  @ApiCreatedResponse({ type: TradingPairResponseDto })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'Некорректные id активов или база = котировка',
  })
  @ApiNotFoundResponse({
    type: ApiNotFoundErrorDto,
    description: 'Листинг или один из активов не найден',
  })
  @ApiConflictResponse({
    type: ApiConflictErrorDto,
    description: 'Такая пара уже есть у листинга',
  })
  addPair(@Param('id') listingId: string, @Body() dto: AddTradingPairDto) {
    return this.listingsService.addTradingPair(listingId, dto);
  }

  @Delete(':id/pairs/:pairId')
  @ApiOperation({ summary: 'Удалить торговую пару у листинга' })
  @ApiParam({ name: 'id', description: 'ID листинга' })
  @ApiParam({ name: 'pairId', description: 'ID пары' })
  @ApiOkResponse({ type: DeleteOkResponseDto })
  @ApiNotFoundResponse({ type: ApiNotFoundErrorDto })
  async removePair(
    @Param('id') listingId: string,
    @Param('pairId') pairId: string,
  ) {
    await this.listingsService.removeTradingPair(listingId, pairId);
    return { ok: true };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Листинг по id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: ListingResponseDto })
  @ApiNotFoundResponse({ type: ApiNotFoundErrorDto })
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Частично обновить листинг' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: ListingResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiNotFoundErrorDto })
  update(@Param('id') id: string, @Body() dto: UpdateListingDto) {
    return this.listingsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить листинг' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: DeleteOkResponseDto })
  @ApiNotFoundResponse({ type: ApiNotFoundErrorDto })
  async remove(@Param('id') id: string) {
    await this.listingsService.remove(id);
    return { ok: true };
  }
}
