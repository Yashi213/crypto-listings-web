import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

/** Тело PATCH /api/feedback/:id */
export class UpdateFeedbackApiDto {
  @ApiPropertyOptional({ description: 'Текст отзыва (мин. 10 символов)' })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Текст отзыва не менее 10 символов' })
  message?: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Оценка 1–5; null — сбросить оценку',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number | null;
}
