import { ApiProperty } from '@nestjs/swagger';
import { ExchangeResponseDto } from '../../exchanges/dto/exchange-response.dto';

export class MarketNewsResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  publishedAt!: Date;

  @ApiProperty()
  imageUrl!: string;

  @ApiProperty()
  imageAlt!: string;

  @ApiProperty({ nullable: true })
  summary!: string | null;

  @ApiProperty({ nullable: true })
  sourceUrl!: string | null;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty()
  exchangeId!: string;

  @ApiProperty({ type: () => ExchangeResponseDto })
  exchange!: ExchangeResponseDto;
}
