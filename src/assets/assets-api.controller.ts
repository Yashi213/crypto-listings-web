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
import { AssetResponseDto } from './dto/asset-response.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetsService } from './assets.service';

@ApiTags('Активы')
@ApiExtraModels(
  ApiConflictErrorDto,
  ApiErrorResponseDto,
  ApiNotFoundErrorDto,
  DeleteOkResponseDto,
  AssetResponseDto,
)
@Controller('api/assets')
export class AssetsApiController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @ApiOperation({ summary: 'Список активов (пагинация)' })
  @ApiOkResponse({
    type: AssetResponseDto,
    isArray: true,
    headers: PAGINATED_COLLECTION_RESPONSE_HEADERS,
  })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  async findAll(
    @Query() q: PaginationQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { items, total } = await this.assetsService.findAllPaginated(
      q.page,
      q.limit,
    );
    setPaginationLinkHeader(req, res, q.page, q.limit, total);
    return items;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать актив' })
  @ApiCreatedResponse({ type: AssetResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiConflictResponse({
    type: ApiConflictErrorDto,
    description: 'Актив с таким тикером уже есть или пустые обязательные поля',
  })
  create(@Body() dto: CreateAssetDto) {
    return this.assetsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Актив по id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: AssetResponseDto })
  @ApiNotFoundResponse({ type: ApiNotFoundErrorDto })
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Частично обновить актив' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: AssetResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiNotFoundErrorDto })
  @ApiConflictResponse({
    type: ApiConflictErrorDto,
    description: 'Конфликт уникальности тикера',
  })
  update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assetsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить актив' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: DeleteOkResponseDto })
  @ApiNotFoundResponse({ type: ApiNotFoundErrorDto })
  @ApiConflictResponse({
    type: ApiConflictErrorDto,
    description: 'Актив используется в листингах или парах — удаление запрещено',
  })
  async remove(@Param('id') id: string) {
    await this.assetsService.remove(id);
    return { ok: true };
  }
}
