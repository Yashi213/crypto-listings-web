import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiProperty({ default: 1, minimum: 1, description: 'Номер страницы (с 1)' })
  @Transform(({ value }) => {
    const n = parseInt(String(value ?? '1'), 10);
    return Number.isNaN(n) || n < 1 ? 1 : n;
  })
  @IsInt()
  @Min(1)
  page: number;

  @ApiProperty({
    default: 20,
    minimum: 1,
    maximum: 100,
    description: 'Размер страницы (максимум 100)',
  })
  @Transform(({ value }) => {
    const n = parseInt(String(value ?? '20'), 10);
    if (Number.isNaN(n) || n < 1) return 20;
    return Math.min(n, 100);
  })
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;
}
