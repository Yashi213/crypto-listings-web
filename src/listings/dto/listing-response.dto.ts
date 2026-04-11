import { ApiProperty } from '@nestjs/swagger';
import { ListingStatus } from '@prisma/client';
import { AssetResponseDto } from '../../assets/dto/asset-response.dto';
import { ExchangeResponseDto } from '../../exchanges/dto/exchange-response.dto';

export class TradingPairResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty()
  listingId!: string;

  @ApiProperty()
  baseAssetId!: string;

  @ApiProperty()
  quoteAssetId!: string;

  @ApiProperty({ type: () => AssetResponseDto })
  baseAsset!: AssetResponseDto;

  @ApiProperty({ type: () => AssetResponseDto })
  quoteAsset!: AssetResponseDto;
}

export class ListingResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: ListingStatus })
  status!: ListingStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  dateAt!: Date;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty()
  exchangeId!: string;

  @ApiProperty({ nullable: true })
  assetId!: string | null;

  @ApiProperty({ type: () => ExchangeResponseDto })
  exchange!: ExchangeResponseDto;

  @ApiProperty({ type: () => AssetResponseDto, nullable: true })
  asset!: AssetResponseDto | null;

  @ApiProperty({ type: TradingPairResponseDto, isArray: true })
  pairs!: TradingPairResponseDto[];
}
