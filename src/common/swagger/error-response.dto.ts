import { ApiProperty } from '@nestjs/swagger';

/** Тело ошибки 400 (валидация, BadRequestException) — для Swagger-примеров */
export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Некорректные данные',
  })
  message!: string | string[];

  /** Нейтральный путь: один DTO используется на всех эндпоинтах */
  @ApiProperty({ example: '/api/resource' })
  path!: string;
}

/** Тело ошибки 404 — для @ApiNotFoundResponse (иначе в Swagger будет пример с 400) */
export class ApiNotFoundErrorDto {
  @ApiProperty({ example: 404 })
  statusCode!: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Ресурс не найден',
  })
  message!: string | string[];

  @ApiProperty({ example: '/api/resource/cuid-example' })
  path!: string;
}

/** Тело ошибки 409 — для @ApiConflictResponse */
export class ApiConflictErrorDto {
  @ApiProperty({ example: 409 })
  statusCode!: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example:
      'Конфликт данных (уникальность, связи с другими сущностями)',
  })
  message!: string | string[];

  @ApiProperty({ example: '/api/resource/cuid-example' })
  path!: string;
}
