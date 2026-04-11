import { ApiProperty } from '@nestjs/swagger';

/** Типичное тело ошибки (глобальный фильтр + ValidationPipe) */
export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Некорректные данные',
  })
  message!: string | string[];

  @ApiProperty({ example: '/api/listings' })
  path!: string;
}
