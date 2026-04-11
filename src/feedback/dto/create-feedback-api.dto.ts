import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
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

  @IsOptional()
  @ValidateIf(
    (o: CreateFeedbackApiDto) =>
      !!String(o.email ?? '').trim() || !!String(o.displayName ?? '').trim(),
  )
  @IsString()
  @MinLength(3)
  displayName?: string;

  @IsOptional()
  @ValidateIf(
    (o: CreateFeedbackApiDto) =>
      !!String(o.email ?? '').trim() || !!String(o.displayName ?? '').trim(),
  )
  @IsEmail()
  email?: string;
}
