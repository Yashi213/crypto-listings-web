import { ApiProperty } from '@nestjs/swagger';

export class ExchangeResponseDto {
  @ApiProperty({ example: 'clxxxxxxxx' })
  id!: string;

  @ApiProperty({ example: 'Binance' })
  name!: string;

  @ApiProperty({ example: 'https://binance.com', nullable: true })
  website!: string | null;

  @ApiProperty({ example: '/uploads/logo.png', nullable: true })
  logoUrl!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
