import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

/** Тело POST /api/feedback (JSON) */
export class CreateFeedbackApiDto {
  @IsString()
  @MinLength(10, { message: 'Текст отзыва не менее 10 символов' })
  message!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
